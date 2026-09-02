// Reading back what we wrote is not free.
//
// Upstash's REST client JSON-parses every value it returns, so hset does NOT
// round-trip types: the string "1" comes back as the number 1, and a JSON
// string comes back as an already-parsed object. Comparing lastOk with === "1"
// therefore marked every SUCCESSFUL cron run as failed, and /admin.html showed
// both jobs red while the feed was updating on schedule.
//
// That is the worst kind of monitoring bug. A false alarm is not a harmless
// error — it teaches you to ignore the alert that finally matters.

const assert = require("node:assert/strict");
const Module = require("node:module");

// Stand in for Upstash: hset stores whatever it is given, and hgetall returns
// every value JSON-parsed, exactly as the real REST client does.
const store = new Map();
const fakeRedis = {
  async hset(key, fields) {
    store.set(key, { ...(store.get(key) || {}), ...fields });
  },
  async hgetall(key) {
    const raw = store.get(key);
    if (!raw) return null;
    return Object.fromEntries(Object.entries(raw).map(([k, v]) => {
      try { return [k, JSON.parse(v)]; } catch { return [k, v]; }
    }));
  },
};
const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request.endsWith("./store")) return { getRedis: async () => fakeRedis };
  return originalLoad(request, parent, isMain);
};

const { readFlag, readJson, recordRun, readRun } = require("../api/_shared/run-health.js");

// Exactly what Upstash does to a value on the way out.
function asUpstashReturns(written) {
  try { return JSON.parse(written); } catch { return written; }
}

// ── The bug that shipped ─────────────────────────────────────────────────────
{
  const written = "1";                       // what recordRun writes for success
  const read = asUpstashReturns(written);    // what readRun actually receives
  assert.equal(read, 1, "sanity: Upstash turns the string \"1\" into the number 1");
  assert.equal(read === "1", false, "sanity: this is why the strict compare failed");
  assert.equal(readFlag(read), true, "a successful run must read as successful");
}

// Every shape a truthy flag can arrive in.
for (const value of [1, "1", true, "true"]) {
  assert.equal(readFlag(value), true, `${JSON.stringify(value)} must read as ok`);
}
// …and everything that must not be mistaken for success.
for (const value of [0, "0", false, "false", null, undefined, "", "yes", 2]) {
  assert.equal(readFlag(value), false, `${JSON.stringify(value)} must not read as ok`);
}

// ── The same bug, second instance ────────────────────────────────────────────
// lastStats is written with JSON.stringify and comes back already parsed, so
// JSON.parse threw and the run's numbers were silently replaced with {}.
{
  const stats = { digestsSent: 9, weeklySent: 2, reminderEmails: 1 };
  const read = asUpstashReturns(JSON.stringify(stats));
  assert.equal(typeof read, "object", "sanity: Upstash hands back an object, not a string");
  assert.throws(() => JSON.parse(read), "sanity: parsing it again is what threw");
  assert.deepEqual(readJson(read), stats, "stats must survive the round trip");
}

// A client that does NOT deserialize must still work — this must not become a
// fix that only works against one client's quirk.
assert.deepEqual(readJson('{"digestsSent":3}'), { digestsSent: 3 }, "a raw JSON string must still parse");
assert.deepEqual(readJson(""), {}, "no stats is an empty object, never a throw");
assert.deepEqual(readJson(null), {});
assert.deepEqual(readJson("not json"), {}, "corrupt stats must not take the dashboard down");

// ── End to end, through the real recordRun/readRun ───────────────────────────
// The unit checks above still pass if readRun stops using readFlag, so drive
// the actual write-then-read path against a client that deserializes.
(async () => {
  const now = Date.parse("2026-09-02T15:00:00.000Z");

  await recordRun("refresh-openings", {
    ok: true,
    stats: { listings: 886, newListings: 12, pushSent: 3 },
  });
  const good = await readRun("refresh-openings", now + 60000);
  assert.equal(good.ok, true, "a run recorded as successful must read back as successful");
  assert.equal(good.problem, null, "a healthy run must raise no problem");
  assert.deepEqual(good.stats, { listings: 886, newListings: 12, pushSent: 3 }, "stats must survive");

  await recordRun("retention", { ok: false, error: "Resend rejected the recipient" });
  const bad = await readRun("retention", now + 60000);
  assert.equal(bad.ok, false, "a failed run must read back as failed");
  assert.match(bad.problem, /Resend rejected the recipient/, "the real error must reach the dashboard");
  assert.doesNotMatch(bad.problem, /unknown error/, "a recorded error must never degrade to \"unknown error\"");

  // A job that has stopped firing is a different failure from one that errors.
  const stale = await readRun("refresh-openings", now + 5 * 60 * 60 * 1000);
  assert.equal(stale.stale, true, "a run older than its schedule allows is stale");
  assert.match(stale.problem, /has not run since/);

  Module._load = originalLoad;
  console.log("Run-health tests passed. A successful run reads as successful.");
})().catch((error) => { console.error(error); process.exit(1); });

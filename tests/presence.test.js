// Live presence: is anyone on the app right now?
//
// This is a different question from retention and needs a different mechanism.
// lastActiveOn is a date, overwritten daily, with no history — it can say "came
// back this week" and nothing finer. Presence is a key per signed-in account
// with a two-minute expiry.
//
// The expiry IS the design. Nothing decrements a counter when a browser tab
// closes, because a closed tab never tells anyone; a stored count would drift
// upward forever and report closed tabs as live users. A key that expires on
// its own cannot drift. It also means the mechanism forgets: two minutes after
// someone leaves there is no record they were ever here, so this never becomes
// a log of when a particular student was online.

const assert = require("node:assert/strict");
const path = require("path");

// A fake Upstash, implemented at the HTTP layer rather than by mocking the
// module. store.js reaches for the client through a dynamic import(), which a
// require hook cannot intercept — and stubbing fetch has the better property
// anyway: the real Upstash client runs, so this exercises the actual code path
// instead of a stand-in for it.
//
// The clock is ours, which is what makes expiry testable rather than assumed.
let now = 0;
const kv = new Map();

globalThis.fetch = async (url, opts) => {
  const body = JSON.parse(opts.body);
  const commands = Array.isArray(body[0]) ? body : [body];
  const results = commands.map((cmd) => {
    const verb = String(cmd[0]).toUpperCase();
    if (verb === "SET") {
      const exIndex = cmd.findIndex((p) => String(p).toUpperCase() === "EX");
      kv.set(cmd[1], { v: cmd[2], exp: exIndex > -1 ? now + Number(cmd[exIndex + 1]) : null });
      return { result: "OK" };
    }
    if (verb === "SCAN") {
      const matchIndex = cmd.findIndex((p) => String(p).toUpperCase() === "MATCH");
      const pattern = matchIndex > -1 ? String(cmd[matchIndex + 1]) : "*";
      const re = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      const live = [...kv.entries()]
        .filter(([k, e]) => re.test(k) && (e.exp === null || e.exp > now))
        .map(([k]) => k);
      return { result: ["0", live] };
    }
    if (verb === "GET") {
      const e = kv.get(cmd[1]);
      return { result: e && (e.exp === null || e.exp > now) ? e.v : null };
    }
    return { result: null };
  });
  const payload = Array.isArray(body[0]) ? results : results[0];
  return { ok: true, status: 200, headers: new Map(), json: async () => payload, text: async () => JSON.stringify(payload) };
};

process.env.UPSTASH_REDIS_REST_URL = "http://localhost";
process.env.UPSTASH_REDIS_REST_TOKEN = "test";

const store = require(path.join(__dirname, "..", "api", "_shared", "store.js"));

(async () => {
  assert.equal(await store.countPresent(), 0, "starts at nobody");

  await store.recordPresence("a@x.edu");
  await store.recordPresence("b@x.edu");
  assert.equal(await store.countPresent(), 2, "two signed-in people present");

  await store.recordPresence("A@X.edu");
  assert.equal(await store.countPresent(), 2,
    "the same person is one person — case must not create a second key");

  // The whole point.
  now += store.PRESENCE_TTL_SECONDS + 1;
  assert.equal(await store.countPresent(), 0,
    "presence must expire by itself; a stale key reports a closed tab as a live user");

  // A heartbeat inside the window keeps someone present past the original expiry.
  await store.recordPresence("a@x.edu");
  now += 60;
  await store.recordPresence("a@x.edu");
  now += 90;
  assert.equal(await store.countPresent(), 1, "a refreshed heartbeat holds presence");

  assert.equal((await store.recordPresence("")).recorded, false, "no address, no key");
  assert.equal((await store.recordPresence(null)).recorded, false, "null address, no key");

  console.log("Presence tests passed. Expires on its own, refreshes cleanly, keeps no history.");
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });

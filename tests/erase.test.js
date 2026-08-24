// Account deletion must actually erase the person.
//
// The privacy policy tells students deletion removes their profile, saved
// alerts, watched companies and notification subscription, and that "we do not
// keep a shadow copy". The previous implementation deleted two keys and left
// the rest — including promptly:unsub:<token>, a token->email map with no TTL
// that resolved to the address forever.
//
// These assertions are the contract behind that sentence in the policy.

const assert = require("node:assert/strict");
const Module = require("module");

// Minimal in-memory Redis. Only the operations erase.js uses.
function fakeRedis() {
  const kv = new Map();
  const sets = new Map();
  const hashes = new Map();
  return {
    kv, sets, hashes,
    async get(k) { return kv.has(k) ? kv.get(k) : null; },
    async set(k, v) { kv.set(k, v); },
    async del(k) { kv.delete(k); },
    async srem(k, m) { (sets.get(k) || new Set()).delete(m); },
    async sadd(k, m) { if (!sets.has(k)) sets.set(k, new Set()); sets.get(k).add(m); },
    async hgetall(k) { return hashes.has(k) ? Object.fromEntries(hashes.get(k)) : {}; },
    async hset(k, obj) {
      if (!hashes.has(k)) hashes.set(k, new Map());
      for (const [f, v] of Object.entries(obj)) hashes.get(k).set(f, v);
    },
  };
}

const redis = fakeRedis();

// Inject the fake before erase.js resolves its dependencies.
const realLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "./store" || request.endsWith("_shared/store")) {
    return { getRedis: async () => redis };
  }
  return realLoad(request, parent, isMain);
};
const { eraseSubscriber } = require("../api/_shared/erase");
Module._load = realLoad;

const EMAIL = "student@example.edu";
const OTHER = "someone.else@example.edu";
const TOKEN = "unsub-token-abc";

// --- Seed every store that holds this address ------------------------------
redis.kv.set(`promptly:subscriber:${EMAIL}`, { email: EMAIL, unsubToken: TOKEN, school: "Trinity" });
redis.kv.set(`promptly:unsub:${TOKEN}`, EMAIL);
redis.kv.set(`promptly:digest:${EMAIL}`, [{ company: "Goldman Sachs" }]);
redis.kv.set(`promptly:verify-sent:${EMAIL}`, "1");
redis.sets.set("promptly:subscribers", new Set([EMAIL, OTHER]));

redis.hashes.set("promptly:watched-sources", new Map([
  ["s1", JSON.stringify({ company: "Jane Street", watchers: [EMAIL, OTHER] })],
  ["s2", JSON.stringify({ company: "Citadel", watchers: [OTHER] })],
]));
redis.hashes.set("promptly:coverage-requests", new Map([
  ["u1", JSON.stringify({ url: "https://x.com", requestedBy: [EMAIL, OTHER], count: 2 })],
]));
redis.hashes.set("promptly:listing-reports", new Map([
  ["r1", JSON.stringify({ company: "Acme", lastReporterEmail: EMAIL, count: 3, reasons: ["dead-link"] })],
  ["r2", JSON.stringify({ company: "Beta", lastReporterEmail: OTHER, count: 1 })],
]));

(async () => {
  const result = await eraseSubscriber(EMAIL);
  assert.equal(result.erased, true);

  // --- Direct keys are gone ------------------------------------------------
  assert.equal(await redis.get(`promptly:subscriber:${EMAIL}`), null, "profile must be deleted");
  assert.equal(await redis.get(`promptly:digest:${EMAIL}`), null, "queued digest matches must be deleted");
  assert.equal(await redis.get(`promptly:verify-sent:${EMAIL}`), null, "verify cooldown must be deleted");
  assert.ok(!redis.sets.get("promptly:subscribers").has(EMAIL), "must leave the subscriber set");

  // The regression that mattered most: a permanent token that still resolved
  // to a deleted person's email address.
  assert.equal(await redis.get(`promptly:unsub:${TOKEN}`), null,
    "the unsubscribe token->email map must not survive deletion");

  // --- Shared rows are scrubbed, not destroyed -----------------------------
  const watched = await redis.hgetall("promptly:watched-sources");
  const s1 = JSON.parse(watched.s1);
  assert.deepEqual(s1.watchers, [OTHER], "only this user leaves the watchers list");
  assert.equal(s1.company, "Jane Street", "the watched company itself must survive for other watchers");
  assert.deepEqual(JSON.parse(watched.s2).watchers, [OTHER], "untouched rows must be left alone");

  const coverage = await redis.hgetall("promptly:coverage-requests");
  const u1 = JSON.parse(coverage.u1);
  assert.deepEqual(u1.requestedBy, [OTHER], "requester address must be removed");
  assert.equal(u1.count, 2, "the demand signal itself is not personal data and must survive");

  const reports = await redis.hgetall("promptly:listing-reports");
  const r1 = JSON.parse(reports.r1);
  assert.equal(r1.lastReporterEmail, null, "reporter contact address must be dropped");
  assert.equal(r1.count, 3, "a broken link is still broken — the report must survive");
  assert.equal(JSON.parse(reports.r2).lastReporterEmail, OTHER, "other reporters must be untouched");

  // --- Erasing a stranger must not corrupt anything ------------------------
  const before = JSON.stringify(await redis.hgetall("promptly:watched-sources"));
  await eraseSubscriber("nobody@example.edu");
  assert.equal(JSON.stringify(await redis.hgetall("promptly:watched-sources")), before,
    "erasing an unknown address must be a no-op");

  console.log("Erasure tests passed. No shadow copy survives account deletion.");
})();

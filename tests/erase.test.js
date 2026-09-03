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
// Loaded before the Module._load patch below so the interception never sees them.
const fs = require("fs");
const path = require("path");

// Minimal in-memory Redis. Only the operations erase.js uses.
function fakeRedis() {
  const kv = new Map();
  const sets = new Map();
  const hashes = new Map();
  return {
    kv, sets, hashes,
    async get(k) { return kv.has(k) ? kv.get(k) : null; },
    async set(k, v) { kv.set(k, v); },
    async del(...keys) {
      for (const k of keys.flat()) {
        kv.delete(k);
        sets.delete(k);
        hashes.delete(k);
      }
    },
    async srem(k, m) { (sets.get(k) || new Set()).delete(m); },
    async sadd(k, m) { if (!sets.has(k)) sets.set(k, new Set()); sets.get(k).add(m); },
    async smembers(k) { return Array.from(sets.get(k) || []); },
    async expire() { return 1; },
    async scan(cursor, { match } = {}) {
      const prefix = String(match || "").replace(/\*$/, "");
      return ["0", Array.from(kv.keys()).filter((k) => k.startsWith(prefix))];
    },
    async hgetall(k) { return hashes.has(k) ? Object.fromEntries(hashes.get(k)) : {}; },
    async hset(k, obj) {
      if (!hashes.has(k)) hashes.set(k, new Map());
      for (const [f, v] of Object.entries(obj)) hashes.get(k).set(f, v);
    },
    async hdel(k, ...fields) {
      for (const field of fields) (hashes.get(k) || new Map()).delete(field);
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
const { createVerifyToken, consumeVerifyToken } = require("../api/_shared/tokens");
Module._load = realLoad;

const EMAIL = "student@example.edu";
const OTHER = "someone.else@example.edu";
const TOKEN = "unsub-token-abc";
const LEGACY_VERIFY_TOKEN = "verify-token-before-index";

// --- Seed every store that holds this address ------------------------------
redis.kv.set(`promptly:subscriber:${EMAIL}`, { email: EMAIL, unsubToken: TOKEN, school: "Trinity" });
redis.kv.set(`promptly:unsub:${TOKEN}`, EMAIL);
redis.kv.set(`promptly:digest:${EMAIL}`, [{ company: "Goldman Sachs" }]);
redis.kv.set(`promptly:verify-sent:${EMAIL}`, "1");
redis.kv.set(`promptly:verify:${LEGACY_VERIFY_TOKEN}`, EMAIL);
redis.kv.set("promptly:verify:other-users-token", OTHER);
redis.sets.set("promptly:subscribers", new Set([EMAIL, OTHER]));

redis.hashes.set("promptly:watched-sources", new Map([
  ["s1", JSON.stringify({ company: "Jane Street", watchers: [EMAIL, OTHER] })],
  ["s2", JSON.stringify({ company: "Citadel", watchers: [OTHER] })],
  ["s3", JSON.stringify({ company: "Solo Watch", watchers: [EMAIL] })],
]));
redis.hashes.set("promptly:coverage-requests", new Map([
  ["u1", JSON.stringify({ url: "https://x.com", requestedBy: [EMAIL, OTHER], count: 2 })],
]));
redis.hashes.set("promptly:listing-reports", new Map([
  ["r1", JSON.stringify({ company: "Acme", lastReporterEmail: EMAIL, count: 3, reasons: ["dead-link"] })],
  ["r2", JSON.stringify({ company: "Beta", lastReporterEmail: OTHER, count: 1 })],
]));

(async () => {
  const VERIFY_TOKEN = await createVerifyToken(EMAIL, { force: true });
  assert.equal(await redis.get(`promptly:verify:${VERIFY_TOKEN}`), EMAIL,
    "new verification mappings must resolve to the intended address");
  assert.deepEqual(await redis.smembers(`promptly:verify-index:${EMAIL}`), [VERIFY_TOKEN],
    "new verification mappings must be indexed for account erasure");

  const consumed = await createVerifyToken(OTHER, { force: true });
  assert.equal(await consumeVerifyToken(consumed), OTHER, "a verification token must still redeem once");
  assert.equal(await redis.get(`promptly:verify:${consumed}`), null, "redeeming must delete the token mapping");
  assert.ok(!(await redis.smembers(`promptly:verify-index:${OTHER}`)).includes(consumed),
    "redeeming must also remove the token from the reverse index");

  const result = await eraseSubscriber(EMAIL);
  assert.equal(result.erased, true);

  // --- Direct keys are gone ------------------------------------------------
  assert.equal(await redis.get(`promptly:subscriber:${EMAIL}`), null, "profile must be deleted");
  assert.equal(await redis.get(`promptly:digest:${EMAIL}`), null, "queued digest matches must be deleted");
  assert.equal(await redis.get(`promptly:verify-sent:${EMAIL}`), null, "verify cooldown must be deleted");
  assert.equal(await redis.get(`promptly:verify:${VERIFY_TOKEN}`), null,
    "indexed verification token->email mappings must be deleted");
  assert.equal(await redis.get(`promptly:verify:${LEGACY_VERIFY_TOKEN}`), null,
    "verification mappings issued before the index existed must be deleted");
  assert.equal(await redis.get("promptly:verify:other-users-token"), OTHER,
    "another user's verification token must be untouched");
  assert.deepEqual(await redis.smembers(`promptly:verify-index:${EMAIL}`), [],
    "the per-address verification-token index must be deleted");
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
  assert.equal(watched.s3, undefined, "a watched source with no remaining users must be deleted");

  const coverage = await redis.hgetall("promptly:coverage-requests");
  const u1 = JSON.parse(coverage.u1);
  assert.deepEqual(u1.requestedBy, [OTHER], "requester address must be removed");
  assert.equal(u1.count, 2, "the demand signal itself is not personal data and must survive");

  const reports = await redis.hgetall("promptly:listing-reports");
  const r1 = JSON.parse(reports.r1);
  assert.equal(r1.lastReporterEmail, null, "reporter contact address must be dropped");
  assert.equal(r1.count, 3, "a broken link is still broken — the report must survive");
  assert.equal(JSON.parse(reports.r2).lastReporterEmail, OTHER, "other reporters must be untouched");

  // A partial Redis outage must keep the profile available for a retry. If the
  // profile were deleted first, its unsubscribe token would become
  // undiscoverable and the API could then delete the login around leftover data.
  const retryEmail = "retry@example.edu";
  const retryToken = "retry-unsub-token";
  redis.kv.set(`promptly:subscriber:${retryEmail}`, { email: retryEmail, unsubToken: retryToken });
  redis.kv.set(`promptly:unsub:${retryToken}`, retryEmail);
  redis.sets.set("promptly:subscribers", new Set([...redis.sets.get("promptly:subscribers"), retryEmail]));
  redis.hashes.set("promptly:watched-sources", new Map([
    ...redis.hashes.get("promptly:watched-sources"),
    ["retry", JSON.stringify({ company: "Retry Co", watchers: [retryEmail] })],
  ]));
  const workingHgetall = redis.hgetall;
  redis.hgetall = async (key) => {
    if (key === "promptly:watched-sources") throw new Error("synthetic Redis outage");
    return workingHgetall(key);
  };
  await assert.rejects(() => eraseSubscriber(retryEmail), /synthetic Redis outage/);
  assert.ok(await redis.get(`promptly:subscriber:${retryEmail}`),
    "the profile must survive an incomplete cleanup so account deletion can be retried");
  redis.hgetall = workingHgetall;
  assert.equal((await eraseSubscriber(retryEmail)).erased, true, "a retry must finish the cleanup");
  assert.equal((await redis.hgetall("promptly:watched-sources")).retry, undefined,
    "a retry must remove a sole-user watched source after the outage clears");

  // --- Erasing a stranger must not corrupt anything ------------------------
  const before = JSON.stringify(await redis.hgetall("promptly:watched-sources"));
  await eraseSubscriber("nobody@example.edu");
  assert.equal(JSON.stringify(await redis.hgetall("promptly:watched-sources")), before,
    "erasing an unknown address must be a no-op");

  // --- There must be exactly ONE erasure implementation --------------------
  // store.js once had its own partial deleteSubscriber() while erase.js had the
  // complete one, and the two drifted: the partial version missed coverage
  // requests and the contact address on listing reports. Nothing called it, so
  // the gap was invisible. It is now a thin alias, and this keeps it that way —
  // a second implementation is a deletion promise waiting to be broken.
  const storeSource = fs.readFileSync(path.join(__dirname, "..", "api/_shared/store.js"), "utf8");
  const body = storeSource.slice(
    storeSource.indexOf("async function deleteSubscriber(email)"),
    storeSource.indexOf("\n}\n", storeSource.indexOf("async function deleteSubscriber(email)"))
  );
  assert.ok(
    body.includes("eraseSubscriber"),
    "deleteSubscriber() must delegate to eraseSubscriber(), not reimplement erasure"
  );
  assert.ok(
    !/redis\.(del|srem|hset)\(/.test(body),
    "deleteSubscriber() is doing its own key deletion again — that is a second, " +
    "divergent erasure path. Route it through _shared/erase.js instead."
  );

  console.log("Erasure tests passed. No shadow copy survives account deletion.");
})();

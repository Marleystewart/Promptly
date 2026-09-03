// promptly:verify:<token> maps a token to an EMAIL ADDRESS, and it is only
// reachable from the token side. Nothing recorded the token against the
// subscriber, so neither deletion path could find it — a student who asked to
// be deleted kept their address in Redis for up to VERIFY_TTL (one week), while
// the privacy page promises no shadow copy is kept.
//
// This is the same gap erase.js was written to close for the unsubscribe token.

const assert = require("node:assert/strict");
const Module = require("node:module");

// Minimal Redis stand-in: real enough for get/set/del/srem and TTL bookkeeping.
const store = new Map();
const fakeRedis = {
  async get(k) { return store.has(k) ? store.get(k) : null; },
  async set(k, v) { store.set(k, v); return "OK"; },
  async del(k) { return store.delete(k) ? 1 : 0; },
  async srem() { return 1; },
  async hgetall() { return null; },
  async hset() { return 1; },
  async keys() { return [...store.keys()]; },
};
const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request.endsWith("./store")) {
    return { getRedis: async () => fakeRedis, normalizeSubscriber: (p) => p };
  }
  return originalLoad(request, parent, isMain);
};

const { createVerifyToken, consumeVerifyToken, purgeUnverified } = require("../api/_shared/tokens.js");
const { eraseSubscriber } = require("../api/_shared/erase.js");

const EMAIL = "student@example.edu";
const KEY = `promptly:subscriber:${EMAIL}`;
const verifyKeys = () => [...store.keys()].filter((k) => k.startsWith("promptly:verify:") && !k.includes("verify-sent"));

function seed(extra = {}) {
  store.clear();
  store.set(KEY, { email: EMAIL, verified: false, unsubToken: "unsub-abc", ...extra });
}

(async () => {
  // 1. The token is recorded on the profile, so it can be found later.
  seed();
  const token = await createVerifyToken(EMAIL, { force: true });
  assert.ok(token, "a token is issued");
  assert.equal(store.get(`promptly:verify:${token}`), EMAIL, "token maps to the address");
  assert.equal(store.get(KEY).verifyToken, token, "and the profile records which token is outstanding");

  // 2. Explicit deletion must take the address with it.
  await eraseSubscriber(EMAIL);
  assert.equal(store.get(KEY), undefined, "profile gone");
  assert.deepEqual(verifyKeys(), [], "no token->email row survives an erasure request");

  // 3. The abandoned-signup purge must be equally thorough.
  seed();
  const t2 = await createVerifyToken(EMAIL, { force: true });
  assert.ok(store.get(`promptly:verify:${t2}`));
  await purgeUnverified(EMAIL);
  assert.deepEqual(verifyKeys(), [], "no token->email row survives the 14-day purge");

  // 4. Issuing a new link retires the old one — both a privacy and a security
  //    property: only the newest confirmation link should work.
  seed();
  const first = await createVerifyToken(EMAIL, { force: true });
  const second = await createVerifyToken(EMAIL, { force: true });
  assert.notEqual(first, second);
  assert.equal(store.get(`promptly:verify:${first}`), undefined, "the superseded link is revoked");
  assert.equal(store.get(`promptly:verify:${second}`), EMAIL);
  assert.equal(verifyKeys().length, 1, "exactly one confirmation link is ever outstanding");

  // 5. Redeeming clears the pointer, so a used token is not left looking live.
  const email = await consumeVerifyToken(second);
  assert.equal(email, EMAIL);
  assert.equal(store.get(`promptly:verify:${second}`), undefined, "single use");
  assert.equal(store.get(KEY).verifyToken, null, "the profile no longer claims one is outstanding");

  Module._load = originalLoad;
  console.log("Verify-token erasure tests passed. Deletion takes the address with it.");
})().catch((e) => { console.error(e); process.exit(1); });

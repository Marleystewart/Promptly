// Tokens that prove someone controls an email address.
//
// Why this exists: alert records are keyed by email and nothing else. Without a
// proof-of-control step, anyone could enrol a stranger, overwrite their
// preferences, or make us mail an address that never asked for anything. A
// verification token closes that, and an unsubscribe token gives every
// recipient a one-click way out that does not require opening the app.

const crypto = require("crypto");
const { getRedis } = require("./store");

const VERIFY_PREFIX = "promptly:verify:";
const UNSUB_PREFIX = "promptly:unsub:";
const VERIFY_TTL = 60 * 60 * 24 * 7;   // a confirmation link is good for a week
const VERIFY_COOLDOWN = 60 * 15;       // at most one confirmation email per 15 min

function newToken() {
  // 32 bytes of CSPRNG output, url-safe. Not guessable, not enumerable.
  return crypto.randomBytes(32).toString("base64url");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase().slice(0, 254);
}

// Create a single-use confirmation token for an email address. Returns null if
// one was issued very recently, so a loop of profile saves cannot spray mail.
async function createVerifyToken(email, { force = false } = {}) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return null;

  // Scheduled reminders pass force: they are already gated by a claim key, so
  // the interactive cooldown would only suppress a legitimate send.
  if (!force) {
    const cooldownKey = `promptly:verify-sent:${normalized}`;
    const slot = await redis.set(cooldownKey, "1", { nx: true, ex: VERIFY_COOLDOWN });
    if (!slot) return null; // already sent one recently
  }

  const token = newToken();
  await redis.set(`${VERIFY_PREFIX}${token}`, normalized, { ex: VERIFY_TTL });
  return token;
}

// Redeem a confirmation token exactly once. Returns the email, or null.
async function consumeVerifyToken(token) {
  const redis = await getRedis();
  const clean = String(token || "").trim();
  if (!redis || !clean) return null;
  const key = `${VERIFY_PREFIX}${clean}`;
  const email = await redis.get(key);
  if (!email) return null;
  await redis.del(key); // single use
  return String(email);
}

// A stable per-subscriber unsubscribe token, minted once and reused so that
// every email we send can carry a working opt-out link.
async function getOrCreateUnsubToken(email) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return null;

  const key = `promptly:subscriber:${normalized}`;
  const record = await redis.get(key);
  if (record && record.unsubToken) return record.unsubToken;

  const token = newToken();
  await redis.set(`${UNSUB_PREFIX}${token}`, normalized);
  if (record) {
    await redis.set(key, { ...record, unsubToken: token });
  }
  return token;
}

// Resolve an unsubscribe token back to its email address.
async function resolveUnsubToken(token) {
  const redis = await getRedis();
  const clean = String(token || "").trim();
  if (!redis || !clean) return null;
  const email = await redis.get(`${UNSUB_PREFIX}${clean}`);
  return email ? String(email) : null;
}

// Flip a subscriber to verified. Never settable from client input — this is the
// only path that can set it, and it requires holding the emailed token.
async function markVerified(email) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return { verified: false };
  const key = `promptly:subscriber:${normalized}`;
  const record = await redis.get(key);
  if (!record) return { verified: false, missing: true };
  await redis.set(key, { ...record, verified: true, verifiedAt: new Date().toISOString() });
  return { verified: true };
}

// Turn off email for a subscriber (used by the unsubscribe link).
async function disableEmailFor(email) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return { changed: false };
  const key = `promptly:subscriber:${normalized}`;
  const record = await redis.get(key);
  if (!record) return { changed: false };
  await redis.set(key, {
    ...record,
    emailNotifications: false,
    weeklyRecap: false,
    deadlineReminders: false,
    unsubscribedAt: new Date().toISOString(),
  });
  return { changed: true };
}

// Delete an unconfirmed profile and everything hanging off it. Refuses to touch
// a confirmed account — this is the destructive path, so it double-checks
// rather than trusting the caller's filtering.
async function purgeUnverified(email) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return { purged: false };

  const key = `promptly:subscriber:${normalized}`;
  const record = await redis.get(key);
  if (!record) return { purged: false, missing: true };
  if (record.verified === true) return { purged: false, refused: "confirmed account" };

  const jobs = [
    redis.del(key),
    redis.srem("promptly:subscribers", normalized),
    redis.del(`promptly:digest:${normalized}`),
    redis.del(`promptly:verify-sent:${normalized}`),
  ];
  if (record.unsubToken) jobs.push(redis.del(`${UNSUB_PREFIX}${record.unsubToken}`));
  await Promise.all(jobs);
  return { purged: true };
}

module.exports = {
  purgeUnverified,
  createVerifyToken,
  consumeVerifyToken,
  getOrCreateUnsubToken,
  resolveUnsubToken,
  markVerified,
  disableEmailFor,
  normalizeEmail,
};

const { studentStatus } = require("../../student-email.js");

function readBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

const crypto = require("crypto");

// Redis key names are visible to operators and backups. Abuse controls only
// need a stable bucket, not the raw IP address or email, so use an opaque
// digest for short-lived rate-limit and delivery keys.
function opaqueKeyPart(value) {
  return crypto.createHash("sha256").update(String(value || "unknown")).digest("hex").slice(0, 32);
}

function redisEnv() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  };
}

function hasRedisEnv() {
  const env = redisEnv();
  return Boolean(env.url && env.token);
}

async function getRedis() {
  const env = redisEnv();
  if (!env.url || !env.token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({
    url: env.url,
    token: env.token,
  });
}

const { isSafePushSubscription } = require("./push-target");

function normalizeSubscriber(profile = {}, subscription = null) {
  const email = String(profile.email || "").trim().toLowerCase();
  const savedAlerts = Array.isArray(profile.savedAlerts)
    ? profile.savedAlerts.slice(0, 50).map((item) => ({
      company: String(item.company || "").trim(),
      role: String(item.role || "").trim(),
      program: String(item.program || "").trim(),
      deadline: String(item.deadline || "").trim(),
      field: String(item.field || "").trim(),
      sourceUrl: String(item.sourceUrl || "").trim(),
      browse: item.browse === true,
    })).filter((item) => item.company && item.role)
    : [];
  const watches = Array.isArray(profile.watches)
    ? profile.watches.slice(0, 100).map((w) => ({
      id: String(w.id || "").trim(),
      company: String(w.company || "").trim(),
      url: String(w.url || "").trim().slice(0, 300),
      ats: String(w.ats || "").trim(),
    })).filter((w) => w.company)
    : [];
  // Derived from the address the SERVER holds, never copied from the client —
  // a browser could otherwise claim studentVerified for any inbox. Same shared
  // module the signup badge uses, so the two can never disagree.
  const student = studentStatus(email);

  return {
    email,
    watches,
    studentVerified: student.verified,
    studentDomain: student.domain,
    name: String(profile.name || "").trim() || "there",
    school: String(profile.school || "").trim(),
    // A band, never the exact year. The alert pipeline never used gradYear —
    // only the founder dashboard did — and exact school plus exact year is
    // close to identifying in a small cohort. See gradYearBand() in script.js.
    gradYearBand: String(profile.gradYearBand || "").trim(),
    major: String(profile.major || "").trim(),
    preferredLocation: String(profile.preferredLocation || "").trim(),
    remoteOkay: profile.remoteOkay !== false,
    willingToRelocate: profile.willingToRelocate === true,
    interests: String(profile.interests || "").trim(),
    fields: Array.isArray(profile.fields) ? profile.fields.filter(Boolean) : [],
    // Only keep a push subscription that points at a real vendor push service.
    pushSubscription: (() => {
      const candidate = subscription || profile.pushSubscription || null;
      return isSafePushSubscription(candidate) ? candidate : null;
    })(),
    emailNotifications: profile.emailNotifications !== false,
    pushNotifications: profile.pushNotifications !== false,
    weeklyRecap: profile.weeklyRecap !== false,
    deadlineReminders: profile.deadlineReminders !== false,
    savedAlerts,
    updatedAt: new Date().toISOString(),
  };
}

// What happens to the stored push endpoint on a save.
//
// Two things were wrong here, and they pulled in opposite directions.
//
// FUNCTIONAL: an ordinary settings save calls saveSubscriber() with no
// subscription, and serverAlertProfile() has never carried pushSubscription. So
// the computed value was null, and the spread overwrote a perfectly good stored
// endpoint with it. Enabling push worked; changing any other setting afterwards
// silently switched it back off, and nothing anywhere said so.
//
// PRIVACY: a push endpoint identifies one specific browser install and is the
// address we can reach it at. Keeping it after someone turns push OFF is
// retention past the purpose it was collected for — the August audit asked for
// "retain saved endpoint only while enabled/account active".
//
// So: an explicit new subscription wins; switching push off clears it
// deliberately; otherwise the existing one is left alone.
function resolvePushSubscription(existing, subscriber, subscription) {
  if (subscriber.pushNotifications === false) return null;
  if (subscription) return subscriber.pushSubscription;
  return subscriber.pushSubscription || existing.pushSubscription || null;
}

async function saveSubscriber(profile, subscription) {
  const redis = await getRedis();
  const subscriber = normalizeSubscriber(profile, subscription);

  if (!redis) {
    return { saved: false, setupRequired: "Add Upstash Redis environment variables in Vercel.", subscriber };
  }

  const key = "promptly:subscriber:" + subscriber.email;
  const existing = (await redis.get(key)) || {};
  const merged = {
    ...existing,
    ...subscriber,
    createdAt: existing.createdAt || new Date().toISOString(),
    pushSubscription: resolvePushSubscription(existing, subscriber, subscription),
  };

  await redis.set(key, merged);
  await redis.sadd("promptly:subscribers", subscriber.email);

  return { saved: true, subscriber: merged };
}

// Stamp the first time this account actually received an alert.
//
// Written once and never overwritten: the question it answers is "has Promptly
// ever delivered anything to this person?", and a most-recent timestamp cannot
// answer that. Best-effort — bookkeeping must never break a send that already
// succeeded. Lives on the subscriber record, so account deletion removes it
// with everything else.
async function markFirstAlert(email, at = new Date().toISOString()) {
  try {
    const redis = await getRedis();
    const normalized = String(email || "").trim().toLowerCase();
    if (!redis || !normalized) return { stamped: false };
    const key = "promptly:subscriber:" + normalized;
    const record = await redis.get(key);
    if (!record || record.firstAlertAt) return { stamped: false };
    await redis.set(key, { ...record, firstAlertAt: at });
    return { stamped: true };
  } catch {
    return { stamped: false };
  }
}

// Read one subscriber record (used to check verification before sending).
async function getSubscriber(email) {
  const redis = await getRedis();
  const normalized = String(email || "").trim().toLowerCase();
  if (!redis || !normalized) return null;
  return (await redis.get("promptly:subscriber:" + normalized)) || null;
}

// Load EVERY subscriber at once. Kept for the admin dashboard, which is a
// single human looking at a page — never use it on a cron path.
//
// Why: this issues one Redis round trip per subscriber, all in flight at the
// same time. At a few hundred subscribers that is fine. At 100k it is 100,000
// concurrent HTTP requests to Upstash plus every record resident in memory,
// which exhausts the function's memory and the connection pool long before it
// finishes. Cron paths use forEachSubscriberBatch instead.
const ADMIN_LIST_CAP = 5000;

async function listSubscribers({ cap = ADMIN_LIST_CAP } = {}) {
  const redis = await getRedis();
  if (!redis) return { subscribers: [], setupRequired: "Add Upstash Redis environment variables in Vercel." };

  const emails = await redis.smembers("promptly:subscribers");
  if (!emails.length) return { subscribers: [], total: 0, truncated: false };

  const slice = emails.slice(0, cap);
  const subscribers = [];
  // Sequential batches, not one giant Promise.all.
  for (let i = 0; i < slice.length; i += 100) {
    const chunk = slice.slice(i, i + 100);
    const records = await Promise.all(chunk.map((email) => redis.get("promptly:subscriber:" + email)));
    for (const record of records) if (record) subscribers.push(record);
  }
  return { subscribers, total: emails.length, truncated: emails.length > cap };
}

// Stream subscribers in bounded batches. This is what the hourly refresh and
// the daily retention job use, so memory and in-flight requests stay flat no
// matter how many subscribers exist.
//
// SSCAN may return duplicates across iterations (it guarantees only that
// members present for the whole scan are returned at least once), so the
// caller-visible set is de-duplicated here.
async function forEachSubscriberBatch(handler, { batchSize = 200 } = {}) {
  const redis = await getRedis();
  if (!redis) return { processed: 0, setupRequired: "Add Upstash Redis environment variables in Vercel." };

  let cursor = 0;
  let processed = 0;
  const seen = new Set();

  do {
    const result = await redis.sscan("promptly:subscribers", cursor, { count: batchSize });
    const next = Array.isArray(result) ? result[0] : result?.cursor;
    const emails = (Array.isArray(result) ? result[1] : result?.members) || [];
    cursor = Number(next) || 0;

    const fresh = emails.filter((email) => email && !seen.has(email));
    fresh.forEach((email) => seen.add(email));
    if (!fresh.length) continue;

    const records = (await Promise.all(fresh.map((email) => redis.get("promptly:subscriber:" + email)))).filter(Boolean);
    if (records.length) {
      await handler(records);
      processed += records.length;
    }
  } while (cursor !== 0);

  return { processed };
}

// Attach a watched company to a subscriber's record so the alert pipeline
// (matchesOpening) sends them that company's postings. Creates a lightweight
// subscriber if one doesn't exist yet, so a watch never silently fails to
// Record that an account was active today.
//
// Retention cannot be measured from the anonymous daily counters: they have no
// identity by design, so they can say 11 app opens and never whether that was
// eleven people once or one person eleven times. Answering "did the people who
// signed up last week come back this week" requires knowing that a returning
// person is the same person.
//
// Kept as small as that question allows:
//   - a DATE, not a timestamp — the cohort maths works in days, and an exact
//     time of day would describe someone's routine for no analytical gain
//   - one field on the subscriber record, which account deletion already
//     erases wholesale, so it needs no separate erasure path
//   - overwritten, never appended — there is no history here, no session log,
//     and no way to reconstruct what anyone did or when they did it
//
// What this is deliberately NOT: a per-person activity feed. The dashboard
// reads these dates only in aggregate.
async function recordActivity(email) {
  const redis = await getRedis();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!redis || !normalizedEmail) return { recorded: false };
  const key = "promptly:subscriber:" + normalizedEmail;
  const existing = await redis.get(key);
  if (!existing) return { recorded: false };
  const day = new Date().toISOString().slice(0, 10);
  if (existing.lastActiveOn === day) return { recorded: true, unchanged: true };
  await redis.set(key, { ...existing, lastActiveOn: day });
  return { recorded: true, unchanged: false };
}

// alert. Returns the subscriber's full watch list.
async function addSubscriberWatch(email, watch) {
  const redis = await getRedis();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!redis || !normalizedEmail) return { saved: false, watches: [] };
  const key = "promptly:subscriber:" + normalizedEmail;
  const existing = (await redis.get(key)) || { email: normalizedEmail, createdAt: new Date().toISOString() };
  const clean = {
    id: String(watch.id || "").trim(),
    company: String(watch.company || "").trim(),
    url: String(watch.url || "").trim().slice(0, 300),
    ats: String(watch.ats || "").trim(),
  };
  const watches = Array.isArray(existing.watches) ? existing.watches.filter((w) => w.id !== clean.id) : [];
  watches.push(clean);
  const merged = { ...existing, email: normalizedEmail, watches: watches.slice(0, 100), updatedAt: new Date().toISOString() };
  await redis.set(key, merged);
  await redis.sadd("promptly:subscribers", normalizedEmail);
  return { saved: true, watches: merged.watches };
}

async function removeSubscriberWatch(email, id) {
  const redis = await getRedis();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!redis || !normalizedEmail) return { saved: false, watches: [] };
  const key = "promptly:subscriber:" + normalizedEmail;
  const existing = await redis.get(key);
  if (!existing) return { saved: false, watches: [] };
  const watches = (Array.isArray(existing.watches) ? existing.watches : []).filter((w) => w.id !== String(id || "").trim());
  await redis.set(key, { ...existing, watches, updatedAt: new Date().toISOString() });
  return { saved: true, watches };
}

async function deleteSubscriber(email) {
  // Single source of truth for erasure lives in _shared/erase.js, which also
  // scrubs coverage requests and the contact address on listing reports. This
  // stayed a partial implementation for a while and the two drifted; keeping it
  // as a thin alias means a caller can never reach the weaker version by
  // accident. Required lazily because erase.js requires this module.
  const { eraseSubscriber } = require("./erase");
  const { erased } = await eraseSubscriber(email);
  return { removed: Boolean(erased) };
}

// Remove a dead push subscription (endpoint returned 404/410) so we stop
// sending to it. Keeps the rest of the subscriber profile intact.
async function clearPushSubscription(email) {
  const redis = await getRedis();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!redis || !normalizedEmail) return { cleared: false };
  const key = "promptly:subscriber:" + normalizedEmail;
  const existing = await redis.get(key);
  if (!existing || !existing.pushSubscription) return { cleared: false };
  await redis.set(key, { ...existing, pushSubscription: null });
  return { cleared: true };
}

async function takeTestAlertSlot(email, requester = "") {
  const redis = await getRedis();
  if (!redis) return { allowed: true, stored: false };

  const normalizedEmail = String(email || "").trim().toLowerCase().slice(0, 254);
  const normalizedRequester = String(requester || "unknown").trim().slice(0, 80);
  const [emailSlot, requesterSlot] = await Promise.all([
    redis.set(`promptly:test-email:${opaqueKeyPart(normalizedEmail)}`, "1", { nx: true, ex: 60 }),
    redis.set(`promptly:test-requester:${opaqueKeyPart(normalizedRequester)}`, "1", { nx: true, ex: 10 }),
  ]);
  return { allowed: Boolean(emailSlot && requesterSlot), stored: true };
}

// Throttle for the unauthenticated analytics endpoint.
//
// /api/stats accepts an anonymous POST and increments a counter. Nothing there
// is personal and nothing costs money, so this is not an abuse-cost control —
// it protects the only numbers Marley has. Uninstrumented, one script could
// make "app opens" say anything, and a decision would get made on it.
//
// Deliberately generous: real use fires several allowlisted events per session
// (app open, view change, opening view), so the cap has to sit well above
// normal behaviour or it silently loses real signal. The requester key is
// hashed, like every other rate-limit key here, so throttling does not create
// the per-visitor identifier the analytics design exists to avoid.
async function takeAnalyticsSlot(requester = "") {
  const redis = await getRedis();
  if (!redis) return { allowed: true, stored: false };
  const key = `promptly:analytics-rate:${opaqueKeyPart(String(requester || "unknown").slice(0, 80))}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    return { allowed: count <= 120, stored: true };
  } catch {
    // Never let a limiter failure lose real analytics.
    return { allowed: true, stored: false };
  }
}

// Throttle for the account-owned subscribe endpoint.
//
// /api/subscribe took unlimited unauthenticated writes, and every unseen email
// triggered a confirmation send. A script could therefore make Promptly mail
// thousands of strangers — burning the Resend quota and, far worse, teaching
// mailbox providers that our sending domain sends unsolicited mail. Domain
// reputation is extremely hard to win back, so this is throttled per IP.
//
// Two windows: a burst limit (a real person saving a profile repeatedly) and
// an hourly cap on how many DISTINCT addresses one source can enrol.
const SUBSCRIBE_BURST = 10;        // per minute per IP
const SUBSCRIBE_NEW_PER_HOUR = 5;  // distinct new addresses per hour per IP

async function takeSubscribeSlot(requester = "unknown", { isNewAddress = false } = {}) {
  const redis = await getRedis();
  if (!redis) return { allowed: true, stored: false };
  const who = opaqueKeyPart(String(requester || "unknown").slice(0, 64));

  const burstKey = `promptly:sub-burst:${who}`;
  const burst = await redis.incr(burstKey);
  if (burst === 1) await redis.expire(burstKey, 60);
  if (burst > SUBSCRIBE_BURST) return { allowed: false, reason: "burst", stored: true };

  // Only creating a brand-new record can trigger mail, so only that is capped
  // hourly — someone editing their own profile is never blocked by this.
  if (isNewAddress) {
    const newKey = `promptly:sub-new:${who}`;
    const created = await redis.incr(newKey);
    if (created === 1) await redis.expire(newKey, 3600);
    if (created > SUBSCRIBE_NEW_PER_HOUR) return { allowed: false, reason: "new-address", stored: true };
  }
  return { allowed: true, stored: true };
}

// Simple fixed-window throttle for admin secret guesses (10 per minute per IP).
async function takeAdminAttempt(requester = "unknown") {
  const redis = await getRedis();
  if (!redis) return { allowed: true, stored: false };
  const key = `promptly:admin-attempt:${opaqueKeyPart(String(requester).slice(0, 64))}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return { allowed: count <= 10, stored: true };
}

async function claimOnce(key, ttlSeconds) {
  const redis = await getRedis();
  if (!redis) return true;
  const result = await redis.set(`promptly:delivery:${opaqueKeyPart(key)}`, new Date().toISOString(), {
    nx: true,
    ex: ttlSeconds,
  });
  return result === "OK";
}

async function releaseClaim(key) {
  const redis = await getRedis();
  if (!redis) return;
  await redis.del(`promptly:delivery:${opaqueKeyPart(key)}`);
}

module.exports = {
  recordActivity,
  readBody,
  getRedis,
  saveSubscriber,
  listSubscribers,
  forEachSubscriberBatch,
  getSubscriber,
  markFirstAlert,
  deleteSubscriber,
  addSubscriberWatch,
  removeSubscriberWatch,
  clearPushSubscription,
  resolvePushSubscription,
  normalizeSubscriber,
  hasRedisEnv,
  takeTestAlertSlot,
  takeAnalyticsSlot,
  takeSubscribeSlot,
  takeAdminAttempt,
  claimOnce,
  releaseClaim,
  opaqueKeyPart,
};

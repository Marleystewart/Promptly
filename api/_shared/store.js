function readBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
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
  return {
    email,
    watches,
    name: String(profile.name || "").trim() || "there",
    school: String(profile.school || "").trim(),
    gradYear: String(profile.gradYear || "").trim(),
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
  };

  await redis.set(key, merged);
  await redis.sadd("promptly:subscribers", subscriber.email);

  return { saved: true, subscriber: merged };
}

// Read one subscriber record (used to check verification before sending).
async function getSubscriber(email) {
  const redis = await getRedis();
  const normalized = String(email || "").trim().toLowerCase();
  if (!redis || !normalized) return null;
  return (await redis.get("promptly:subscriber:" + normalized)) || null;
}

async function listSubscribers() {
  const redis = await getRedis();
  if (!redis) return { subscribers: [], setupRequired: "Add Upstash Redis environment variables in Vercel." };

  const emails = await redis.smembers("promptly:subscribers");
  if (!emails.length) return { subscribers: [] };

  const subscribers = (await Promise.all(emails.map((email) => redis.get("promptly:subscriber:" + email)))).filter(Boolean);
  return { subscribers };
}

// Attach a watched company to a subscriber's record so the alert pipeline
// (matchesOpening) sends them that company's postings. Creates a lightweight
// subscriber if one doesn't exist yet, so a watch never silently fails to
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
  const redis = await getRedis();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!redis || !normalizedEmail) return { removed: false };
  await Promise.all([
    redis.del(`promptly:subscriber:${normalizedEmail}`),
    redis.srem("promptly:subscribers", normalizedEmail),
  ]);
  return { removed: true };
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
    redis.set(`promptly:test-email:${normalizedEmail}`, "1", { nx: true, ex: 60 }),
    redis.set(`promptly:test-requester:${normalizedRequester}`, "1", { nx: true, ex: 10 }),
  ]);
  return { allowed: Boolean(emailSlot && requesterSlot), stored: true };
}

// Simple fixed-window throttle for admin secret guesses (10 per minute per IP).
async function takeAdminAttempt(requester = "unknown") {
  const redis = await getRedis();
  if (!redis) return { allowed: true, stored: false };
  const key = `promptly:admin-attempt:${String(requester).slice(0, 64)}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 60);
  return { allowed: count <= 10, stored: true };
}

async function claimOnce(key, ttlSeconds) {
  const redis = await getRedis();
  if (!redis) return true;
  const result = await redis.set(`promptly:delivery:${key}`, new Date().toISOString(), {
    nx: true,
    ex: ttlSeconds,
  });
  return result === "OK";
}

async function releaseClaim(key) {
  const redis = await getRedis();
  if (!redis) return;
  await redis.del(`promptly:delivery:${key}`);
}

module.exports = {
  readBody,
  getRedis,
  saveSubscriber,
  listSubscribers,
  getSubscriber,
  deleteSubscriber,
  addSubscriberWatch,
  removeSubscriberWatch,
  clearPushSubscription,
  normalizeSubscriber,
  hasRedisEnv,
  takeTestAlertSlot,
  takeAdminAttempt,
  claimOnce,
  releaseClaim,
};

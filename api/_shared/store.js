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
    })).filter((item) => item.company && item.role)
    : [];
  return {
    email,
    name: String(profile.name || "").trim() || "there",
    school: String(profile.school || "").trim(),
    gradYear: String(profile.gradYear || "").trim(),
    major: String(profile.major || "").trim(),
    preferredLocation: String(profile.preferredLocation || "").trim(),
    remoteOkay: profile.remoteOkay !== false,
    willingToRelocate: profile.willingToRelocate === true,
    interests: String(profile.interests || "").trim(),
    fields: Array.isArray(profile.fields) ? profile.fields.filter(Boolean) : [],
    pushSubscription: subscription || profile.pushSubscription || null,
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

async function listSubscribers() {
  const redis = await getRedis();
  if (!redis) return { subscribers: [], setupRequired: "Add Upstash Redis environment variables in Vercel." };

  const emails = await redis.smembers("promptly:subscribers");
  if (!emails.length) return { subscribers: [] };

  const subscribers = (await Promise.all(emails.map((email) => redis.get("promptly:subscriber:" + email)))).filter(Boolean);
  return { subscribers };
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
  saveSubscriber,
  listSubscribers,
  normalizeSubscriber,
  hasRedisEnv,
  takeTestAlertSlot,
  claimOnce,
  releaseClaim,
};

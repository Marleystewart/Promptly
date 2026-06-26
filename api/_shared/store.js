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
  return {
    email,
    name: String(profile.name || "").trim() || "there",
    major: String(profile.major || "").trim(),
    fields: Array.isArray(profile.fields) ? profile.fields.filter(Boolean) : [],
    pushSubscription: subscription || profile.pushSubscription || null,
    emailNotifications: profile.emailNotifications !== false,
    pushNotifications: profile.pushNotifications !== false,
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

module.exports = { readBody, saveSubscriber, listSubscribers, normalizeSubscriber, hasRedisEnv };

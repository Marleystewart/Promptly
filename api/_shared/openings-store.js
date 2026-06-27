// Redis read/write for the live (auto-aggregated) openings feed.
// Falls back gracefully when Redis isn't configured so the app never breaks —
// the frontend always has its curated baseline to show.

const KEY = "promptly:openings:live";

function redisEnv() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
  };
}

async function getRedis() {
  const env = redisEnv();
  if (!env.url || !env.token) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({ url: env.url, token: env.token });
}

async function saveLiveOpenings(payload) {
  const redis = await getRedis();
  if (!redis) return { saved: false };
  await redis.set(KEY, payload);
  return { saved: true };
}

async function getLiveOpenings() {
  const redis = await getRedis();
  if (!redis) return { openings: [], updatedAt: null, setupRequired: true };
  const payload = (await redis.get(KEY)) || { openings: [], updatedAt: null };
  return payload;
}

module.exports = { saveLiveOpenings, getLiveOpenings };

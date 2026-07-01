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

// Persistent record of every listing URL we've already alerted on. A source
// that fails one refresh and recovers the next would otherwise make all its
// listings look "new" again and re-alert every subscriber.
const ALERTED_KEY = "promptly:openings:alerted";

async function filterNeverAlerted(urls) {
  const redis = await getRedis();
  if (!redis || !urls.length) return urls;
  const membership = await redis.smismember(ALERTED_KEY, urls);
  return urls.filter((_, i) => !membership[i]);
}

async function markAlerted(urls) {
  const redis = await getRedis();
  if (!redis || !urls.length) return;
  await redis.sadd(ALERTED_KEY, ...urls);
}

module.exports = { saveLiveOpenings, getLiveOpenings, filterNeverAlerted, markAlerted };

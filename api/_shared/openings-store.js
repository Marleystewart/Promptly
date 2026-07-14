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

// ── Daily email digest queue ────────────────────────────────────────────────
// Instead of emailing subscribers once per new listing (flooding), the hourly
// refresh queues matches here and the daily retention cron flushes each
// subscriber's queue as ONE digest email. Push alerts stay instant.

const DIGEST_TTL = 60 * 60 * 24 * 3; // unsent items expire after 3 days

function digestKey(email) {
  return `promptly:digest:${String(email || "").trim().toLowerCase()}`;
}

async function queueDigestItems(email, openings) {
  const redis = await getRedis();
  if (!redis || !email || !openings.length) return { queued: 0 };
  const key = digestKey(email);
  await redis.rpush(key, ...openings.map((o) => JSON.stringify(o)));
  await redis.expire(key, DIGEST_TTL);
  return { queued: openings.length };
}

async function takeDigestItems(email) {
  const redis = await getRedis();
  if (!redis || !email) return [];
  const key = digestKey(email);
  const raw = (await redis.lrange(key, 0, -1)) || [];
  await redis.del(key);
  const seen = new Set();
  const items = [];
  for (const entry of raw) {
    try {
      const opening = typeof entry === "string" ? JSON.parse(entry) : entry;
      const id = opening.sourceUrl || `${opening.company}|${opening.role}`;
      if (!opening.company || seen.has(id)) continue;
      seen.add(id);
      items.push(opening);
    } catch {}
  }
  return items;
}

module.exports = { saveLiveOpenings, getLiveOpenings, filterNeverAlerted, markAlerted, queueDigestItems, takeDigestItems };

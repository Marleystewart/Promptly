// First-party, privacy-light analytics stored in Redis. No third parties, no
// cookies, no PII — just counts of what's happening so the founder can see
// what works, and so the app can show real activity (peer pulse).

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

// Only these events are accepted (prevents junk/abuse filling Redis).
const ALLOWED = new Set([
  "app_open", "view_change", "opening_view", "source_click",
  "save_opening", "signup", "search", "install_prompt",
]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

const WEEK_TTL = 60 * 60 * 24 * 9; // keep daily keys ~9 days

async function track(event, sessionId) {
  if (!ALLOWED.has(event)) return { ok: false, error: "unknown event" };
  const redis = await getRedis();
  if (!redis) return { ok: true, stored: false };

  const d = today();
  const key = `promptly:a:${event}:${d}`;
  await redis.incr(key);
  await redis.expire(key, WEEK_TTL);

  if (sessionId) {
    const sk = `promptly:sessions:${d}`;
    await redis.sadd(sk, String(sessionId).slice(0, 64));
    await redis.expire(sk, WEEK_TTL);
  }
  return { ok: true, stored: true };
}

async function counter(redis, event, d) {
  return Number(await redis.get(`promptly:a:${event}:${d}`)) || 0;
}

async function getStats() {
  const redis = await getRedis();
  if (!redis) return { activeToday: 0, applicationsToday: 0, signupsToday: 0, newListingsThisWeek: 0 };

  const d = today();
  const activeToday = (await redis.scard(`promptly:sessions:${d}`)) || 0;
  const applicationsToday = await counter(redis, "source_click", d);
  const signupsToday = await counter(redis, "signup", d);

  let newListingsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    newListingsThisWeek += await counter(redis, "new_listings", day);
  }

  return { activeToday, applicationsToday, signupsToday, newListingsThisWeek };
}

// Used by the refresh job to record how many brand-new listings appeared.
async function recordNewListings(count) {
  const redis = await getRedis();
  if (!redis || !count) return;
  const key = `promptly:a:new_listings:${today()}`;
  await redis.incrby(key, count);
  await redis.expire(key, WEEK_TTL);
}

module.exports = { track, getStats, recordNewListings };

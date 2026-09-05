// First-party aggregate analytics stored in Redis. No third parties, cookies,
// profiles, search text, listing details, or persistent identifiers — just
// allowlisted event counters with a short expiry.

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
  "listing_reported", "watch_prompt_from_search",
]);

// Which sections people actually use, counted per view rather than as one
// undifferentiated "view_change" total. Still a plain daily counter with no
// identity attached: it can say the Openings tab was opened 40 times today and
// can never say by whom, or in what order one person moved between tabs.
//
// A fixed allowlist, not a free-text view name, for the same reason ALLOWED
// exists — an open counter key lets any caller write arbitrary keys into Redis.
const ALLOWED_VIEWS = new Set(["home", "openings", "cycles", "saved", "alerts", "profile"]);

function viewEvent(name) {
  return ALLOWED_VIEWS.has(name) ? `view:${name}` : null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const WEEK_TTL = 60 * 60 * 24 * 9; // keep daily keys ~9 days

async function track(event) {
  const view = typeof event === "string" && event.startsWith("view:") ? viewEvent(event.slice(5)) : null;
  if (!ALLOWED.has(event) && !view) return { ok: false, error: "unknown event" };
  const redis = await getRedis();
  if (!redis) return { ok: true, stored: false };

  const d = today();
  const key = `promptly:a:${event}:${d}`;
  await redis.incr(key);
  await redis.expire(key, WEEK_TTL);

  return { ok: true, stored: true };
}

async function counter(redis, event, d) {
  return Number(await redis.get(`promptly:a:${event}:${d}`)) || 0;
}

async function getStats() {
  const redis = await getRedis();
  if (!redis) return { appOpensToday: 0, applicationsToday: 0, signupsToday: 0, newListingsThisWeek: 0 };

  const d = today();
  const appOpensToday = await counter(redis, "app_open", d);
  const applicationsToday = await counter(redis, "source_click", d);
  const signupsToday = await counter(redis, "signup", d);

  let newListingsThisWeek = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    newListingsThisWeek += await counter(redis, "new_listings", day);
  }

  return { appOpensToday, applicationsToday, signupsToday, newListingsThisWeek };
}

// Which sections got used over the last week, in aggregate. Returned sorted so
// the dashboard shows the most-used tab first without doing its own maths.
async function getViewBreakdown(days = 7) {
  const redis = await getRedis();
  if (!redis) return [];
  const rows = [];
  for (const name of ALLOWED_VIEWS) {
    let total = 0;
    for (let i = 0; i < days; i += 1) {
      const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      total += Number(await redis.get(`promptly:a:view:${name}:${day}`)) || 0;
    }
    rows.push({ view: name, opens: total });
  }
  return rows.sort((a, b) => b.opens - a.opens);
}

// Used by the refresh job to record how many brand-new listings appeared.
async function recordNewListings(count) {
  const redis = await getRedis();
  if (!redis || !count) return;
  const key = `promptly:a:new_listings:${today()}`;
  await redis.incrby(key, count);
  await redis.expire(key, WEEK_TTL);
}

// Remove exact-school progress records written by older clients. Those rows
// cannot be attributed back to a person for selective deletion and are not
// needed by any current product view, so retaining them would only preserve a
// re-identification risk with no user benefit.
async function purgeLegacyOutcomeData() {
  const redis = await getRedis();
  if (!redis) return { removed: 0, stored: false };
  const patterns = ["promptly:school:*", "promptly:schoolfeed:*"];
  let removed = 0;
  for (const match of patterns) {
    let cursor = 0;
    do {
      const result = await redis.scan(cursor, { match, count: 200 });
      cursor = Number(Array.isArray(result) ? result[0] : result?.cursor) || 0;
      const keys = (Array.isArray(result) ? result[1] : result?.keys) || [];
      if (keys.length) {
        await redis.del(...keys);
        removed += keys.length;
      }
    } while (cursor !== 0);
  }
  return { removed, stored: true };
}

module.exports = { track, getStats, getViewBreakdown, ALLOWED_VIEWS, recordNewListings, purgeLegacyOutcomeData, ALLOWED, WEEK_TTL };

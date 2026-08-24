// ─────────────────────────────────────────────────────────────────────────
// Redis store for user-added "watched" sources and coverage requests.
//
// A watched source is a real employer ATS board a user asked Promptly to
// watch (detected from a careers URL). The aggregator merges these into its
// static SOURCES list at refresh time, so the SAME cron + alert pipeline that
// powers the curated feed also pulls user-watched boards — real watching, no
// fake promises. A coverage request is a careers page we could NOT auto-read;
// we log it as intent data (never claim we're alerting on it).
//
// Kept dependency-free (no import of aggregator) so aggregator can import this
// without a cycle.
// ─────────────────────────────────────────────────────────────────────────

const WATCHED_KEY = "promptly:watched-sources";      // hash: id -> source JSON
const COVERAGE_KEY = "promptly:coverage-requests";   // hash: url -> request JSON
const MAX_WATCHED = 200;                             // safety cap on cron work

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

// Stable id for a source config, used to dedupe watches across users.
function sourceId(src) {
  if (src.ats === "workday") return `workday:${src.tenant}/${src.dc}/${src.site}`;
  return `${src.ats}:${src.board}`;
}

function parse(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return null; }
}

async function listWatchedSources() {
  const redis = await getRedis();
  if (!redis) return [];
  const all = (await redis.hgetall(WATCHED_KEY)) || {};
  return Object.values(all).map(parse).filter(Boolean);
}

// Add a watched source (or attach a new watcher to an existing one). Returns
// the stored record. Enforces the cap so a burst of adds can't balloon the
// cron's workload.
async function addWatchedSource(src, watcherEmail = "") {
  const redis = await getRedis();
  if (!redis) return { stored: false, setupRequired: true };
  const id = sourceId(src);
  const existingRaw = await redis.hget(WATCHED_KEY, id);
  const existing = parse(existingRaw);

  if (!existing) {
    const count = await redis.hlen(WATCHED_KEY);
    if (count >= MAX_WATCHED) return { stored: false, atCapacity: true };
  }

  const watchers = new Set((existing && existing.watchers) || []);
  const email = String(watcherEmail || "").trim().toLowerCase();
  if (email) watchers.add(email);

  const record = {
    ...src,
    id,
    watchers: [...watchers].slice(0, 500),
    addedAt: (existing && existing.addedAt) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await redis.hset(WATCHED_KEY, { [id]: JSON.stringify(record) });
  return { stored: true, record };
}

// Detach a watcher from a source. If nobody is left watching it, drop the
// source entirely so the cron stops pulling it.
async function removeWatcher(id, watcherEmail = "") {
  const redis = await getRedis();
  if (!redis || !id) return { removed: false };
  const existing = parse(await redis.hget(WATCHED_KEY, id));
  if (!existing) return { removed: false };
  const email = String(watcherEmail || "").trim().toLowerCase();
  const watchers = ((existing.watchers) || []).filter((w) => w !== email);
  if (!watchers.length) {
    await redis.hdel(WATCHED_KEY, id);
    return { removed: true, sourceDropped: true };
  }
  await redis.hset(WATCHED_KEY, { [id]: JSON.stringify({ ...existing, watchers, updatedAt: new Date().toISOString() }) });
  return { removed: true, sourceDropped: false };
}

// Log a careers page we couldn't auto-read as a coverage request (intent
// data). Never turns into an alert — we don't promise what we can't deliver.
async function logCoverageRequest(url, meta = {}) {
  const redis = await getRedis();
  if (!redis || !url) return { logged: false };
  const key = String(url).slice(0, 300);
  const existing = parse(await redis.hget(COVERAGE_KEY, key));
  const emails = new Set((existing && existing.requestedBy) || []);
  if (meta.email) emails.add(String(meta.email).trim().toLowerCase());
  const record = {
    url: key,
    company: String(meta.company || (existing && existing.company) || "").slice(0, 80),
    requestedBy: [...emails].slice(0, 500),
    count: ((existing && existing.count) || 0) + 1,
    firstRequestedAt: (existing && existing.firstRequestedAt) || new Date().toISOString(),
    lastRequestedAt: new Date().toISOString(),
  };
  await redis.hset(COVERAGE_KEY, { [key]: JSON.stringify(record) });
  return { logged: true, record };
}

async function listCoverageRequests() {
  const redis = await getRedis();
  if (!redis) return [];
  const all = (await redis.hgetall(COVERAGE_KEY)) || {};
  return Object.values(all).map(parse).filter(Boolean);
}

module.exports = {
  sourceId,
  listWatchedSources,
  addWatchedSource,
  removeWatcher,
  logCoverageRequest,
  listCoverageRequests,
  MAX_WATCHED,
  // Exported so account erasure can scrub a departing user's address out of
  // these shared rows (see _shared/erase.js).
  WATCHED_KEY,
  COVERAGE_KEY,
};

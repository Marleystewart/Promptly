// ─────────────────────────────────────────────────────────────────────────
// Per-source health tracking.
//
// Custom company scrapers (api/_shared/company-scrapers/*.js) are the fragile
// part of the pipeline: they read a specific employer's page layout, so a
// redesign breaks them silently — the source simply stops contributing and
// nobody is paged. The ATS adapters are far more stable, but they can break
// too (a board token changes, a tenant moves).
//
// The honest signal is NOT "did the code change" — we can't see that from
// here. It is "did this source stop producing what it used to produce". That
// needs a stored baseline, which is what this file keeps: the best count each
// source has ever returned, and when it last succeeded.
//
// Health states:
//   ok      — ran fine and returned roles
//   broken  — the fetch ERRORED. This is the only state that means something
//             is actually wrong with us.
//   dormant — fetched fine, returned none, but has produced before. Usually
//             just churn: the employer's postings closed. Worth watching when
//             the previous count was large, meaningless when it was 1.
//   quiet   — fetched fine, returned none, and never has. Not a fault: most
//             campus boards are genuinely empty outside Sept–Nov.
//
// "dormant" used to be lumped in with "broken", and that was wrong in the
// direction that destroys a monitor's credibility. On 3 Sep the dashboard
// showed 14 sources needing attention; every single one of them fetched
// cleanly when probed. Nine had gone from ONE role to zero — a job being
// filled, not a scraper breaking. A daily alert that fires on normal churn is
// one nobody reads by the end of the week.
// ─────────────────────────────────────────────────────────────────────────

const { getRedis } = require("./store");

const HEALTH_KEY = "promptly:source-health";

function stateFor(entry) {
  if (!entry) return "quiet";
  if (!entry.ok) return "broken";
  if ((entry.count || 0) > 0) return "ok";
  // Fetched clean but produced nothing. It has produced before, so this is
  // churn rather than breakage — a separate state, not an alarm.
  return (entry.bestCount || 0) > 0 ? "dormant" : "quiet";
}

// Merge this run's result into the stored baseline. bestCount only ever grows,
// so a source that once produced 40 roles and now produces 0 stays visibly
// broken rather than quietly resetting its own baseline to zero.
function mergeEntry(previous, status, now) {
  const prev = previous || {};
  const ok = Boolean(status.ok);
  const count = ok ? Number(status.count) || 0 : 0;
  const bestCount = Math.max(Number(prev.bestCount) || 0, count);

  const entry = {
    company: status.company,
    ats: status.ats,
    // A source's field can't change between runs, so once known it should
    // never be erased by a run that (for whatever reason) didn't pass it.
    field: status.field || prev.field || "Unknown",
    ok,
    count,
    bestCount,
    error: ok ? null : String(status.error || "").slice(0, 160),
    lastCheckedAt: now,
    lastOkAt: ok && count > 0 ? now : prev.lastOkAt || null,
    firstSeenAt: prev.firstSeenAt || now,
  };

  const wasHealthy = stateFor(prev) === "ok";
  // brokeAt tracks both failure states so the dashboard can still say how long
  // a source has been contributing nothing, whichever reason applies.
  const state = stateFor(entry);
  const isBroken = state === "broken" || state === "dormant";
  // brokeAt is the moment it went bad and stays put until it recovers, so the
  // dashboard can say "broken for 3 days" rather than "broken since the last
  // time we checked", which would always read as just now.
  entry.brokeAt = isBroken ? (wasHealthy || !prev.brokeAt ? now : prev.brokeAt) : null;
  return entry;
}

// Called from the refresh cron with aggregateOpenings()'s sourceStatus.
// Never throws: a health-tracking failure must not fail the refresh itself.
async function recordSourceHealth(sourceStatus = []) {
  try {
    const redis = await getRedis();
    if (!redis || !Array.isArray(sourceStatus) || !sourceStatus.length) return null;

    const now = new Date().toISOString();
    const existing = (await redis.hgetall(HEALTH_KEY)) || {};
    const updates = {};

    for (const status of sourceStatus) {
      if (!status || !status.company) continue;
      let prev = existing[status.company];
      if (typeof prev === "string") { try { prev = JSON.parse(prev); } catch { prev = null; } }
      updates[status.company] = JSON.stringify(mergeEntry(prev, status, now));
    }

    if (Object.keys(updates).length) await redis.hset(HEALTH_KEY, updates);
    return Object.keys(updates).length;
  } catch {
    return null;
  }
}

async function listSourceHealth() {
  try {
    const redis = await getRedis();
    if (!redis) return [];
    const raw = (await redis.hgetall(HEALTH_KEY)) || {};
    return Object.values(raw)
      .map((value) => {
        if (typeof value === "string") { try { return JSON.parse(value); } catch { return null; } }
        return value;
      })
      .filter(Boolean)
      .map((entry) => ({ ...entry, state: stateFor(entry) }));
  } catch {
    return [];
  }
}

module.exports = { recordSourceHealth, listSourceHealth, stateFor, mergeEntry, HEALTH_KEY };

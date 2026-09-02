// Did the cron that delivers the product actually run?
//
// Promptly has good instrumentation for its inputs — per-source health, an
// email-deliverability record, a live USAJOBS probe. It had none for its own
// two scheduled jobs. retention.js computed {digestsSent, weeklySent, …} and
// returned it in the HTTP response, which for a Vercel cron goes nowhere a
// human ever sees, and refresh-openings recorded per-source status but never
// whether the run itself finished.
//
// So the one question that matters — "are students receiving alerts?" — had no
// answer anywhere. A cron throwing every night looks exactly like a quiet week.
// This records the outcome of each run so /admin.html can show it and the daily
// heartbeat can report it.

const { getRedis } = require("./store");

const KEY = (name) => `promptly:run:${name}`;

// A run older than this means the schedule itself has stopped firing, which is
// a different and worse failure than a run that fails loudly. Refresh is
// hourly and retention daily, so each gets roughly two missed runs of slack
// before we call it stale.
const STALE_AFTER_MS = {
  "refresh-openings": 3 * 60 * 60 * 1000,
  retention: 30 * 60 * 60 * 1000,
};

// Never let bookkeeping break the job it is measuring.
async function recordRun(name, { ok, stats = {}, error = null } = {}) {
  try {
    const redis = await getRedis();
    if (!redis) return;
    const now = new Date().toISOString();
    const fields = {
      lastRunAt: now,
      lastOk: ok ? "1" : "0",
      lastStats: JSON.stringify(stats).slice(0, 2000),
      lastError: ok ? "" : String(error || "Unknown failure.").slice(0, 400),
    };
    if (ok) fields.lastSuccessAt = now;
    await redis.hset(KEY(name), fields);
  } catch {}
}

function ageMs(iso, now) {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? now - t : null;
}

async function readRun(name, now = Date.now()) {
  let raw = null;
  try {
    const redis = await getRedis();
    if (redis) raw = await redis.hgetall(KEY(name));
  } catch {}

  if (!raw || !raw.lastRunAt) {
    return { name, everRan: false, ok: false, stale: true, problem: `${name} has no recorded run.` };
  }

  let stats = {};
  try { stats = JSON.parse(raw.lastStats || "{}"); } catch {}

  const ok = raw.lastOk === "1";
  const age = ageMs(raw.lastRunAt, now);
  const stale = age === null || age > (STALE_AFTER_MS[name] || 30 * 60 * 60 * 1000);

  return {
    name,
    everRan: true,
    ok,
    stale,
    lastRunAt: raw.lastRunAt,
    lastSuccessAt: raw.lastSuccessAt || null,
    ageMinutes: age === null ? null : Math.round(age / 60000),
    stats,
    error: raw.lastError || null,
    // Stated as a sentence so the dashboard and the email can share it rather
    // than each inventing its own wording.
    problem: stale
      ? `${name} has not run since ${raw.lastRunAt} — the schedule may have stopped.`
      : ok
        ? null
        : `${name} last run failed: ${raw.lastError || "unknown error"}`,
  };
}

async function readRunHealth(now = Date.now()) {
  const runs = await Promise.all(["refresh-openings", "retention"].map((n) => readRun(n, now)));
  const problems = runs.map((r) => r.problem).filter(Boolean);
  return { runs, problems, healthy: problems.length === 0 };
}

module.exports = { recordRun, readRun, readRunHealth, STALE_AFTER_MS };

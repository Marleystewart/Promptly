// Private founder dashboard data: how many accounts, from what schools, grad
// years, fields, plus live activity. Secret-gated (never public — it contains
// user info). Set ADMIN_SECRET (or reuse CRON_SECRET) in Vercel, then open
// /admin.html and paste the secret.

const { listSubscribers, takeAdminAttempt, getRedis } = require("./_shared/store");
const { getStats } = require("./_shared/analytics");
const { listWatchedSources, listCoverageRequests } = require("./_shared/watched-store");
const { listSourceHealth } = require("./_shared/source-health");
const crypto = require("crypto");

function mask(email) {
  if (!email) return "—";
  const [u, d] = String(email).split("@");
  return (u ? u[0] + "***" : "") + "@" + (d || "");
}

// Hash both sides first so the comparison is constant-length: comparing raw
// buffers meant a wrong-length guess returned early, leaking the secret's size.
function secretsMatch(provided, expected) {
  const left = crypto.createHash("sha256").update(String(provided || "")).digest();
  const right = crypto.createHash("sha256").update(String(expected || "")).digest();
  return crypto.timingSafeEqual(left, right);
}

// ADMIN_PIN is a separate, weaker credential: short and numeric on purpose,
// for a fast unlock on health.html's phone-style keypad. It must NEVER gate
// admin.html, which returns real user emails — only ADMIN_SECRET does that.
// A short PIN is brute-forceable in principle; the per-requester throttle
// below is what actually holds that off, not the PIN's length.
function pinMatches(provided) {
  const pin = String(process.env.ADMIN_PIN || "").trim();
  if (!pin || !/^\d{4,8}$/.test(pin)) return false; // unset or misconfigured = no PIN path
  return secretsMatch(provided, pin);
}

module.exports = async function handler(req, res) {
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const authorization = String(req.headers.authorization || "");
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!secret) return res.status(401).json({ error: "Set ADMIN_SECRET in Vercel to use this." });
  const viaPin = pinMatches(provided);

  // Throttle guessing. Without this the shared secret is brute-forceable at
  // request rate, since there is no account lockout to fall back on.
  const requester = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown")
    .split(",")[0].trim().slice(0, 64);
  const attempt = await takeAdminAttempt(requester);
  if (!attempt.allowed) {
    return res.status(429).json({ error: "Too many attempts. Wait a minute and try again." });
  }

  if (!secretsMatch(provided, secret) && !viaPin) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { subscribers = [], setupRequired } = await listSubscribers();

    const bySchool = {}, byGradYear = {}, byField = {};
    let withEmail = 0, withPush = 0;
    for (const s of subscribers) {
      const school = (s.school || "").trim() || "Unknown";
      bySchool[school] = (bySchool[school] || 0) + 1;
      const gy = (s.gradYear || "").trim() || "Unknown";
      byGradYear[gy] = (byGradYear[gy] || 0) + 1;
      (Array.isArray(s.fields) ? s.fields : []).forEach((f) => { byField[f] = (byField[f] || 0) + 1; });
      if (s.email) withEmail += 1;
      if (s.pushSubscription) withPush += 1;
    }
    const sortDesc = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);

    const recent = [...subscribers]
      .sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0))
      .slice(0, 20)
      .map((s) => ({ email: mask(s.email), school: s.school || "—", gradYear: s.gradYear || "—", when: s.updatedAt || s.createdAt || null }));

    const live = await getStats();

    // "Watch any company" intent data — what users asked Promptly to track.
    // Watched = a real ATS board now in the pipeline; coverage = a page we
    // couldn't auto-read (a demand signal for sources worth adding).
    let watched = [], coverage = [];
    try { watched = await listWatchedSources(); } catch {}
    try { coverage = await listCoverageRequests(); } catch {}
    const watchedRows = watched
      .sort((a, b) => (b.watchers || []).length - (a.watchers || []).length)
      .slice(0, 50)
      .map((w) => ({ company: w.company || "—", ats: w.ats || "—", watchers: (w.watchers || []).length }));
    const coverageRows = coverage
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 50)
      .map((c) => ({ url: c.url || "—", company: c.company || "—", requests: c.count || (c.requestedBy || []).length || 1 }));

    // Corroborating content check, not authoritative — a listing here was
    // flagged by weak dead-language text matching, never removed by it. See
    // api/verify-listings.js for why no single link signal is trusted alone.
    let verify = null;
    try {
      const redis = await getRedis();
      verify = redis ? await redis.get("promptly:verify:last-run") : null;
    } catch {}

    // Per-source health. Custom scrapers break silently when an employer
    // redesigns their page, so surface every source's state and sort the
    // broken ones to the top.
    let sourceHealth = [];
    try { sourceHealth = await listSourceHealth(); } catch {}
    const RANK = { broken: 0, quiet: 1, ok: 2 };
    sourceHealth.sort((a, b) =>
      (RANK[a.state] - RANK[b.state]) || String(a.company).localeCompare(String(b.company)));

    const sourceHealthCounts = sourceHealth.reduce((acc, s) => {
      acc[s.state] = (acc[s.state] || 0) + 1;
      return acc;
    }, {});

    // A PIN-holder gets health.html's data only — never subscriber records,
    // even masked ones. Only ADMIN_SECRET unlocks the full founder dashboard.
    if (viaPin && !secretsMatch(provided, secret)) {
      return res.status(200).json({ sourceHealth, sourceHealthCounts });
    }

    return res.status(200).json({
      sourceHealth,
      sourceHealthCounts,
      watchedCount: watched.length,
      coverageCount: coverage.length,
      watched: watchedRows,
      coverage: coverageRows,
      verify,
      totalAccounts: subscribers.length,
      withEmail,
      withPush,
      bySchool: sortDesc(bySchool),
      byGradYear: sortDesc(byGradYear),
      byField: sortDesc(byField),
      live,
      recent,
      setupRequired,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load stats." });
  }
};

module.exports.pinMatches = pinMatches;

// Private founder dashboard data: how many accounts, from what schools, grad
// years, fields, plus live activity. Secret-gated (never public — it contains
// user info). Set ADMIN_SECRET (or reuse CRON_SECRET) in Vercel, then open
// /admin.html and paste the secret.

const { listSubscribers } = require("./_shared/store");
const { getStats } = require("./_shared/analytics");
const { listWatchedSources, listCoverageRequests } = require("./_shared/watched-store");
const crypto = require("crypto");

function mask(email) {
  if (!email) return "—";
  const [u, d] = String(email).split("@");
  return (u ? u[0] + "***" : "") + "@" + (d || "");
}

function secretsMatch(provided, expected) {
  const left = Buffer.from(String(provided || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

module.exports = async function handler(req, res) {
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const authorization = String(req.headers.authorization || "");
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!secret) return res.status(401).json({ error: "Set ADMIN_SECRET in Vercel to use this." });
  if (!secretsMatch(provided, secret)) return res.status(401).json({ error: "Unauthorized" });

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

    return res.status(200).json({
      watchedCount: watched.length,
      coverageCount: coverage.length,
      watched: watchedRows,
      coverage: coverageRows,
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

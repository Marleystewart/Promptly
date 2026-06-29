// Private founder dashboard data: how many accounts, from what schools, grad
// years, fields, plus live activity. Secret-gated (never public — it contains
// user info). Set ADMIN_SECRET (or reuse CRON_SECRET) in Vercel, then open
// /admin.html and paste the secret.

const { listSubscribers } = require("./_shared/store");
const { getStats } = require("./_shared/analytics");
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

    const recent = subscribers
      .slice(-20).reverse()
      .map((s) => ({ email: mask(s.email), school: s.school || "—", gradYear: s.gradYear || "—", when: s.updatedAt || s.createdAt || null }));

    const live = await getStats();

    return res.status(200).json({
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

// Safe, public aggregate stats (no PII) — powers the live "peer pulse".
const { getStats } = require("./_shared/analytics");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const stats = await getStats();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(200).json({ activeToday: 0, applicationsToday: 0, signupsToday: 0, newListingsThisWeek: 0, error: error.message });
  }
};

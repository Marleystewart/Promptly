// Safe, public aggregate stats (no PII) and anonymous progress updates.
const { getStats, recordOutcome } = require("./_shared/analytics");

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  try {
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const result = await recordOutcome({
        school: body.school,
        stage: body.stage,
        company: body.company,
        field: body.field,
      });
      return res.status(200).json(result);
    }

    const stats = await getStats();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(stats);
  } catch (error) {
    if (req.method === "POST") return res.status(200).json({ ok: false, error: error.message });
    return res.status(200).json({ activeToday: 0, applicationsToday: 0, signupsToday: 0, newListingsThisWeek: 0, error: error.message });
  }
};

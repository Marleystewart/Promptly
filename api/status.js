// Receives a student's progress update on a listing (Applied/OA/Interview/Offer).
// Anonymous — powers the per-school pulse and founder analytics.
const { recordOutcome } = require("./_shared/analytics");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await recordOutcome({
      school: body.school,
      stage: body.stage,
      company: body.company,
      field: body.field,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({ ok: false, error: error.message });
  }
};

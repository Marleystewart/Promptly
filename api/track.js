// Receives a single analytics event from the app (fire-and-forget).
const { track } = require("./_shared/analytics");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const result = await track(body.event, body.sessionId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(200).json({ ok: false, error: error.message });
  }
};

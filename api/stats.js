// Safe, public aggregate stats and identifier-free event tracking (merged from
// the old /api/track endpoint to stay under Vercel's Hobby function limit).
const { withCors } = require("./_shared/cors");

const { getStats, track } = require("./_shared/analytics");
const { takeAnalyticsSlot } = require("./_shared/store");

async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  try {
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

      if (body.event) {
        // Anonymous endpoint: cap it so one script cannot rewrite the only
      // numbers we have. Returns ok rather than 429 — a throttled beacon is
      // not a client error worth surfacing in the app.
      const requester = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
      const slot = await takeAnalyticsSlot(requester);
      if (!slot.allowed) return res.status(200).json({ ok: true, stored: false, throttled: true });

      const result = await track(body.event);
        return res.status(200).json(result);
      }
      // Older cached clients may still attempt school/company progress uploads.
      // Refuse them without breaking the local progress UI.
      return res.status(200).json({ ok: false, stored: false, error: "outcome tracking disabled" });
    }

    const stats = await getStats();
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json(stats);
  } catch (error) {
    if (req.method === "POST") return res.status(200).json({ ok: false, error: error.message });
    return res.status(200).json({ appOpensToday: 0, applicationsToday: 0, signupsToday: 0, newListingsThisWeek: 0, error: error.message });
  }
};

module.exports = withCors(handler);

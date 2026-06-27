// Scheduled refresh: pulls live 2027 US internships from employer ATS feeds,
// stores the result in Redis. Triggered by Vercel Cron (see vercel.json) and
// can be run manually by hitting /api/refresh-openings.
//
// If CRON_SECRET is set, manual calls must pass ?secret=... (Vercel Cron is
// always allowed via its x-vercel-cron header).

const { aggregateOpenings } = require("./_shared/aggregator");
const { saveLiveOpenings } = require("./_shared/openings-store");

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const isVercelCron = Boolean(req.headers["x-vercel-cron"]);
  const provided = (req.query && req.query.secret) || "";
  if (secret && !isVercelCron && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await aggregateOpenings();
    const payload = {
      openings: result.openings,
      updatedAt: result.updatedAt,
      count: result.openings.length,
    };
    const saved = await saveLiveOpenings(payload);
    return res.status(200).json({
      ok: true,
      stored: saved.saved,
      count: payload.count,
      updatedAt: payload.updatedAt,
      sources: result.sourceStatus,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Refresh failed" });
  }
};

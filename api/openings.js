// Public read endpoint for the live (auto-aggregated) openings feed.
// The frontend merges these on top of its curated baseline, so a slow or
// empty response never leaves the app blank.

const { getLiveOpenings } = require("./_shared/openings-store");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const payload = await getLiveOpenings();
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");
    return res.status(200).json({
      openings: payload.openings || [],
      updatedAt: payload.updatedAt || null,
      count: (payload.openings || []).length,
    });
  } catch (error) {
    return res.status(200).json({ openings: [], updatedAt: null, count: 0, error: error.message });
  }
};

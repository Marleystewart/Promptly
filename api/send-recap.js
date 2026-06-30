const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, normalizeSubscriber } = require("./_shared/store");
const { getLiveOpenings } = require("./_shared/openings-store");
const { sendWeeklyRecap, matchesOpening } = require("./_shared/alerts");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const body = readBody(req);
    const profile = body.profile || {};
    if (!isValidEmail(profile.email)) return res.status(400).json({ error: "Add a valid email first." });
    const subscriber = normalizeSubscriber(profile, body.subscription || null);
    await saveSubscriber(profile, body.subscription || null);
    const payload = await getLiveOpenings();
    const live = (payload.openings || []).filter((opening) => matchesOpening(opening, subscriber));
    const candidates = [...live, ...(subscriber.savedAlerts || [])];
    const seen = new Set();
    const recap = candidates.filter((opening) => {
      const key = opening.sourceUrl || `${opening.company}|${opening.role}`;
      if (!opening.company || !opening.role || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
    if (!recap.length) return res.status(400).json({ error: "Save an alert or choose a field with live openings first." });
    const result = await sendWeeklyRecap(recap, subscriber);
    return res.status(result.sent ? 200 : 202).json({ ok: result.sent, count: recap.length, ...result });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not send weekly recap." });
  }
};

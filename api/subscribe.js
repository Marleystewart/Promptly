const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber } = require("./_shared/store");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = readBody(req);
    const profile = body.profile || {};

    if (!isValidEmail(profile.email)) {
      return res.status(400).json({ error: "Use a properly formatted email address." });
    }

    const result = await saveSubscriber(profile, body.subscription || null);
    return res.status(result.saved ? 200 : 202).json({
      ok: true,
      saved: result.saved,
      setupRequired: result.setupRequired,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not save subscriber." });
  }
};

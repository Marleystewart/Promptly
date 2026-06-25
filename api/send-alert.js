const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, listSubscribers, normalizeSubscriber } = require("./_shared/store");
const { sendEmailAlert, sendPushAlert, matchesOpening } = require("./_shared/alerts");

const fallbackOpening = {
  company: "Google",
  role: "Associate Product Manager",
  program: "Summer 2026",
  deadline: "Nov 4, 2025",
  field: "Technology",
};

async function settleAlert(opening, subscriber) {
  const results = { email: null, push: null };

  if (subscriber.emailNotifications !== false && subscriber.email) {
    results.email = await sendEmailAlert(opening, subscriber);
  }

  if (subscriber.pushNotifications !== false && subscriber.pushSubscription) {
    try {
      results.push = await sendPushAlert(opening, subscriber);
    } catch (error) {
      results.push = { sent: false, error: error.message || "Push failed." };
    }
  }

  return results;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = readBody(req);
    const opening = { ...fallbackOpening, ...(body.opening || {}) };
    const profile = body.profile || {};
    const directSubscriber = normalizeSubscriber(profile, body.subscription || null);

    if (directSubscriber.email && !isValidEmail(directSubscriber.email)) {
      return res.status(400).json({ error: "Use a valid Gmail, Yahoo, iCloud, Outlook, Hotmail, AOL, or .edu email." });
    }

    if (directSubscriber.email) {
      await saveSubscriber(profile, body.subscription || null);
    }

    const stored = await listSubscribers();
    const matched = stored.subscribers.length
      ? stored.subscribers.filter((subscriber) => matchesOpening(opening, subscriber))
      : directSubscriber.email
        ? [directSubscriber]
        : [];

    if (!matched.length) {
      return res.status(404).json({
        error: "No matching subscribers found yet.",
        setupRequired: stored.setupRequired,
      });
    }

    const deliveries = await Promise.all(matched.map((subscriber) => settleAlert(opening, subscriber)));
    const emailSent = deliveries.filter((item) => item.email && item.email.sent).length;
    const pushSent = deliveries.filter((item) => item.push && item.push.sent).length;
    const setupRequired = [stored.setupRequired, ...deliveries.flatMap((item) => [item.email && item.email.setupRequired, item.push && item.push.setupRequired])].filter(Boolean);
    const errors = deliveries.flatMap((item) => [item.email && item.email.error, item.push && item.push.error]).filter(Boolean);

    return res.status(emailSent || pushSent ? 200 : 202).json({
      ok: true,
      matched: matched.length,
      emailSent,
      pushSent,
      setupRequired: [...new Set(setupRequired)],
      errors,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not send alert." });
  }
};

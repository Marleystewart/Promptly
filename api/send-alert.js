const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, normalizeSubscriber, takeTestAlertSlot, getSubscriber } = require("./_shared/store");
const { sendEmailAlert } = require("./_shared/alerts");
const { getOrCreateUnsubToken } = require("./_shared/tokens");

const fallbackOpening = {
  company: "Google",
  role: "Associate Product Manager",
  program: "Summer 2026",
  deadline: "Nov 4, 2025",
  field: "Technology",
};

function safeText(value, fallback, maxLength = 120) {
  const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
  return (text || fallback).slice(0, maxLength);
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeTestOpening(value = {}) {
  return {
    company: safeText(value.company, fallbackOpening.company, 80),
    role: safeText(value.role, fallbackOpening.role, 120),
    program: safeText(value.program, fallbackOpening.program, 80),
    deadline: safeText(value.deadline, fallbackOpening.deadline, 60),
    field: safeText(value.field, fallbackOpening.field, 60),
    sourceUrl: safeUrl(value.sourceUrl),
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = readBody(req);
    const opening = normalizeTestOpening(body.opening);
    const profile = body.profile || {};
    const directSubscriber = normalizeSubscriber(profile, body.subscription || null);

    if (!isValidEmail(directSubscriber.email)) {
      return res.status(400).json({ error: "Use a properly formatted email address." });
    }

    const requester = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
    const rateLimit = await takeTestAlertSlot(directSubscriber.email, requester);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: "Please wait a moment before sending another test." });
    }

    const stored = await saveSubscriber(profile, body.subscription || null);

    // Only send to an address that has confirmed it wants mail from us.
    // Without this, anyone could point this endpoint at a stranger's inbox.
    const record = await getSubscriber(directSubscriber.email);
    if (!record || record.verified !== true) {
      return res.status(403).json({
        error: "Confirm your email first — we've sent you a confirmation link. Alerts start once you click it.",
        needsVerification: true,
      });
    }

    const unsubToken = await getOrCreateUnsubToken(directSubscriber.email);
    const email = await sendEmailAlert(opening, directSubscriber, unsubToken);
    const emailSent = email.sent ? 1 : 0;
    const pushSent = 0;
    const setupRequired = [stored.setupRequired, email.setupRequired].filter(Boolean);
    const errors = [email.error].filter(Boolean);

    return res.status(emailSent || pushSent ? 200 : 202).json({
      ok: true,
      matched: 1,
      emailSent,
      pushSent,
      setupRequired: [...new Set(setupRequired)],
      errors,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not send alert." });
  }
};

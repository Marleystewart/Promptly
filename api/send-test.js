const { withCors } = require("./_shared/cors");

const webpush = require("web-push");
const { isSafePushSubscription } = require("./_shared/push-target");

function readBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" ? url.toString() : "/";
  } catch {
    return "/";
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@example.com";

  if (!publicKey || !privateKey) {
    return res.status(500).json({ error: "Push keys are missing in Vercel environment variables." });
  }

  try {
    const body = readBody(req);
    if (!body.subscription) {
      return res.status(400).json({ error: "Missing push subscription." });
    }
    // The endpoint decides where our server sends a request, so it has to be a
    // real vendor push URL and not somewhere the caller picked.
    if (!isSafePushSubscription(body.subscription)) {
      return res.status(400).json({ error: "That push subscription is not from a recognized browser push service." });
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);

    await webpush.sendNotification(
      body.subscription,
      JSON.stringify({
        title: body.title || "Opening",
        body: body.body || "A new internship opening is live.",
        url: safeUrl(body.url),
      })
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not send test push." });
  }
};

module.exports = withCors(handler);

const { withCors } = require("./_shared/cors");

const webpush = require("web-push");
const { isSafePushSubscription } = require("./_shared/push-target");
const { getSubscriber, takeTestAlertSlot } = require("./_shared/store");
const { authenticateUser } = require("./_shared/auth-user");

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
    const auth = await authenticateUser(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
    if (!body.subscription) {
      return res.status(400).json({ error: "Missing push subscription." });
    }
    // The endpoint decides where our server sends a request, so it has to be a
    // real vendor push URL and not somewhere the caller picked.
    if (!isSafePushSubscription(body.subscription)) {
      return res.status(400).json({ error: "That push subscription is not from a recognized browser push service." });
    }
    // Same throttle as send-alert and send-recap. This endpoint sends a real
    // push to a real device; without a limit a signed-in account could hammer
    // its own lock screen and burn the push quota. It was the only one of the
    // three send endpoints without one.
    const requester = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
    const rateLimit = await takeTestAlertSlot(auth.email, requester);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: "Please wait a moment before sending another test." });
    }

    const subscriber = await getSubscriber(auth.email);
    const storedEndpoint = String(subscriber?.pushSubscription?.endpoint || "");
    const requestedEndpoint = String(body.subscription?.endpoint || "");
    if (!storedEndpoint || requestedEndpoint !== storedEndpoint) {
      return res.status(403).json({ error: "Enable notifications on this signed-in account before sending a test." });
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

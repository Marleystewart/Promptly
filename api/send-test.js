const webpush = require("web-push");

function readBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

module.exports = async function handler(req, res) {
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

    webpush.setVapidDetails(subject, publicKey, privateKey);

    await webpush.sendNotification(
      body.subscription,
      JSON.stringify({
        title: body.title || "Opening",
        body: body.body || "A new internship opening is live.",
        url: "/",
      })
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not send test push." });
  }
};

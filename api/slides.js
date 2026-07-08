// Shared storage for the internal Slide Studio (content/slides.html) so
// edits made by Marley or Cam show up for both of them. Not part of the
// student-facing app — just lets the marketing tool persist to Redis
// instead of living only in one browser tab.
const { readBody, getRedis } = require("./_shared/store");

const KEY = "promptly:slides:decks";
const EDIT_KEY = process.env.SLIDES_EDIT_KEY || "promptly2027";

module.exports = async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const redis = await getRedis();
  if (!redis) {
    return res.status(200).json({ ok: false, setupRequired: "Add Upstash Redis environment variables in Vercel." });
  }

  if (req.method === "GET") {
    const decks = await redis.get(KEY);
    return res.status(200).json({ ok: true, decks: decks || null });
  }

  // POST — save. Require the shared edit key so a random visitor who finds
  // this URL can't overwrite the carousels.
  const body = readBody(req);
  if (String(body.editKey || "") !== EDIT_KEY) {
    return res.status(401).json({ ok: false, error: "Wrong edit key." });
  }
  if (!body.decks || typeof body.decks !== "object") {
    return res.status(400).json({ ok: false, error: "Missing decks." });
  }

  await redis.set(KEY, body.decks);
  return res.status(200).json({ ok: true });
};

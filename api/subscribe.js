const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, deleteSubscriber } = require("./_shared/store");

function bearerToken(req) {
  const authorization = String(req.headers?.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

async function deleteAccount(req, res) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "Sign in again before deleting your account." });

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serverSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  if (!supabaseUrl || !serverSecret) {
    return res.status(503).json({
      error: "Account deletion is not configured.",
      setupRequired: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in Vercel.",
    });
  }

  const authHeaders = { Authorization: `Bearer ${token}`, apikey: serverSecret };
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: authHeaders });
  if (!userResponse.ok) return res.status(401).json({ error: "Your session is no longer valid. Sign in and try again." });
  const user = await userResponse.json();
  if (!user?.id) return res.status(401).json({ error: "Supabase could not verify this account." });

  const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${serverSecret}`, apikey: serverSecret },
  });
  if (!deleteResponse.ok) {
    const details = await deleteResponse.json().catch(() => ({}));
    return res.status(502).json({ error: details.message || "Supabase could not delete this account." });
  }

  let subscriberRemoved = false;
  try {
    subscriberRemoved = Boolean((await deleteSubscriber(user.email)).removed);
  } catch {}
  return res.status(200).json({ ok: true, subscriberRemoved });
}

module.exports = async function handler(req, res) {
  if (req.method === "DELETE") return deleteAccount(req, res);
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

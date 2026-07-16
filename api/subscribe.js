const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, deleteSubscriber, addSubscriberWatch, removeSubscriberWatch } = require("./_shared/store");
const { watchCompany, unwatchCompany } = require("./_shared/watch");

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

    // ── Watch any company ────────────────────────────────────────────────
    // Same endpoint (we're at Vercel's 12-function limit) — an `action`
    // routes to the watch flow instead of the normal subscriber save.
    if (body.action === "watch" || body.action === "unwatch") {
      const email = String(profile.email || body.email || "").trim().toLowerCase();
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Add your email first so we know where to send the alert." });
      }

      if (body.action === "unwatch") {
        await unwatchCompany({ id: body.id, email }).catch(() => {});
        const { watches } = await removeSubscriberWatch(email, body.id);
        return res.status(200).json({ ok: true, watches });
      }

      const outcome = await watchCompany({ url: body.url, company: body.company || "", email });
      if (outcome.status === "watching") {
        const { watches } = await addSubscriberWatch(email, {
          id: outcome.id, company: outcome.company, url: String(body.url || "").trim(), ats: outcome.ats,
        });
        return res.status(200).json({ ok: true, ...outcome, watches });
      }
      // logged / invalid / unreachable / at_capacity — report honestly.
      return res.status(outcome.status === "logged" ? 200 : 422).json({ ok: outcome.status === "logged", ...outcome });
    }

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

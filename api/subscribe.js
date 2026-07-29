const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, deleteSubscriber, addSubscriberWatch, removeSubscriberWatch, getSubscriber } = require("./_shared/store");
const { watchCompany, unwatchCompany } = require("./_shared/watch");
const {
  createVerifyToken, consumeVerifyToken, resolveUnsubToken,
  markVerified, disableEmailFor, getOrCreateUnsubToken,
} = require("./_shared/tokens");
const { sendVerificationEmail } = require("./_shared/alerts");

// Minimal styled page for links opened from an email client.
function page(res, status, title, message, cta = true) {
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).send(`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${esc(title)} — Promptly</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1020;color:#fafaff;
font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;padding:24px}
.card{max-width:460px;text-align:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);
border-radius:20px;padding:36px 30px}h1{font-size:24px;margin:0 0 10px}p{color:rgba(250,250,255,.7);line-height:1.55;margin:0}
a{display:inline-block;margin-top:22px;background:#6841ff;color:#fff;text-decoration:none;font-weight:700;
border-radius:10px;padding:12px 20px}</style></head><body><div class="card">
<h1>${esc(title)}</h1><p>${esc(message)}</p>${cta ? '<a href="/">Open Promptly</a>' : ""}
</div></body></html>`);
}

// Confirmation and unsubscribe links are opened from an email client, so they
// arrive as GETs and must render a page rather than return JSON.
async function handleEmailLink(req, res) {
  const action = String(req.query?.action || "");
  const token = String(req.query?.token || "");

  if (action === "verify") {
    const email = await consumeVerifyToken(token);
    if (!email) {
      return page(res, 400, "That link has expired", "Confirmation links last seven days and work once. Open Promptly and we'll send a fresh one.");
    }
    const result = await markVerified(email);
    if (!result.verified) {
      return page(res, 404, "We couldn't find that profile", "It may have been deleted. Open Promptly to set your alerts up again.");
    }
    return page(res, 200, "Email confirmed", "Your alerts are on. We'll tell you the moment a matching internship opens.");
  }

  if (action === "unsubscribe") {
    const email = await resolveUnsubToken(token);
    if (!email) {
      return page(res, 400, "That link is no longer valid", "If you're still getting emails you don't want, reply to any of them and a person will sort it out.");
    }
    await disableEmailFor(email);
    return page(res, 200, "Unsubscribed", "You won't get any more emails from Promptly. Phone alerts, if you turned them on, are unaffected.", false);
  }

  return res.status(400).json({ error: "Unknown action." });
}

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
  if (req.method === "GET") return handleEmailLink(req, res);
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

    // A record keyed by email proves nothing on its own — anyone can type an
    // address. Until the owner clicks the emailed link we hold the record but
    // send no alerts to it. The cooldown inside createVerifyToken means a burst
    // of profile saves can't turn into a burst of mail.
    const verified = result.saved && result.subscriber && result.subscriber.verified === true;
    let verificationSent = false;
    if (result.saved && !verified) {
      try {
        const token = await createVerifyToken(result.subscriber.email);
        if (token) {
          await getOrCreateUnsubToken(result.subscriber.email);
          const sent = await sendVerificationEmail(result.subscriber, token);
          verificationSent = Boolean(sent.sent);
        }
      } catch {
        // Never fail the save because confirmation mail couldn't go out.
      }
    }

    return res.status(result.saved ? 200 : 202).json({
      ok: true,
      saved: result.saved,
      verified,
      verificationSent,
      setupRequired: result.setupRequired,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not save subscriber." });
  }
};

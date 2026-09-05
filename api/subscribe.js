const { withCors } = require("./_shared/cors");

const { isValidEmail } = require("./_shared/email-validator");
const { readBody, saveSubscriber, addSubscriberWatch, removeSubscriberWatch, getSubscriber, takeSubscribeSlot, recordActivity } = require("./_shared/store");
const { eraseSubscriber } = require("./_shared/erase");
const { watchCompany, unwatchCompany } = require("./_shared/watch");
const {
  consumeVerifyToken, resolveUnsubToken, markVerified, disableEmailFor,
} = require("./_shared/tokens");
const { sendListingReport } = require("./_shared/alerts");
const { recordReport, takeReportSlot } = require("./_shared/reports");
const { authenticateUser, bearerToken, emailBelongsToUser } = require("./_shared/auth-user");

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

async function deleteAccount(req, res) {
  if (!bearerToken(req)) return res.status(401).json({ error: "Sign in again before deleting your account." });
  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serverSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  if (!supabaseUrl || !serverSecret) {
    return res.status(503).json({
      error: "Account deletion is not configured.",
      setupRequired: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in Vercel.",
    });
  }

  // Deletion must remain available even if the project's email-confirmation
  // policy is temporarily unsafe or unavailable. A valid session is enough to
  // delete that session's own account; it is not enough for send/edit routes.
  const auth = await authenticateUser(req, { requireConfirmedEmail: false });
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  // Erase Promptly's alert-side records first. If Supabase deletion fails the
  // user can still retry while authenticated; deleting auth first could strand
  // an undeletable Redis profile with no account left to prove ownership.
  let subscriberRemoved = false;
  try {
    subscriberRemoved = Boolean((await eraseSubscriber(auth.email)).erased);
  } catch {
    return res.status(502).json({ error: "Promptly could not finish deleting your alert data. Nothing else was deleted; please try again." });
  }

  const deleteResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${encodeURIComponent(auth.user.id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${serverSecret}`, apikey: serverSecret },
  });
  if (!deleteResponse.ok) {
    const details = await deleteResponse.json().catch(() => ({}));
    return res.status(502).json({ error: details.message || "Supabase could not delete this account." });
  }

  return res.status(200).json({ ok: true, subscriberRemoved });
}

async function handler(req, res) {
  if (req.method === "DELETE") return deleteAccount(req, res);
  if (req.method === "GET") return handleEmailLink(req, res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = readBody(req);
    const profile = body.profile || {};

    // ── Report a bad listing ─────────────────────────────────────────────
    // Deliberately does NOT require an email or a saved profile: the whole
    // point is that a student who just hit a dead link can say so in one tap.
    // Saved first, emailed second. Await delivery so a serverless runtime does
    // not freeze this request before Resend has accepted the notification.
    if (body.action === "report") {
      const requester = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown")
        .split(",")[0].trim().slice(0, 64);
      const slot = await takeReportSlot(requester);
      if (!slot.allowed) {
        return res.status(429).json({ error: "Thanks — you've sent a few already. Try again later." });
      }
      const outcome = await recordReport({
        company: body.company,
        role: body.role,
        location: body.location,
        url: body.url,
        reason: body.reason,
        note: body.note,
        requester,
      });
      if (!outcome.ok) return res.status(400).json({ error: outcome.error || "Could not save that report." });
      let email = { sent: false };
      try {
        email = await sendListingReport(outcome.report);
      } catch (error) {
        console.error("Listing report email failed:", error && error.message ? error.message : error);
      }
      return res.status(200).json({ ok: true, emailSent: Boolean(email && email.sent) });
    }

    // Everything below changes account-linked data or sends a message. Derive
    // the address from the authenticated Supabase user; a JSON email field is
    // never proof that the caller owns that inbox.
    const auth = await authenticateUser(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
    if (!emailBelongsToUser(profile.email || body.email, auth.email)) {
      return res.status(403).json({ error: "That email does not belong to your signed-in account." });
    }
    profile.email = auth.email;

    // ── Watch any company ────────────────────────────────────────────────
    // Same endpoint (we're at Vercel's 12-function limit) — an `action`
    // routes to the watch flow instead of the normal subscriber save.
    // Activity ping. Rides inside this endpoint rather than adding a file:
    // Vercel's 12-function ceiling is a hard cap and a test asserts it.
    //
    // Authenticated on purpose. An anonymous ping would need its own
    // identifier to be meaningful, which is exactly the thing the analytics
    // module refuses to create; using the session means the only record is a
    // date on an account that already exists and is already erased on deletion.
    if (body.action === "ping") {
      const result = await recordActivity(auth.email);
      return res.status(200).json({ ok: true, ...result });
    }

    if (body.action === "watch" || body.action === "unwatch" || body.action === "resend-verification") {
      const email = auth.email;
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Add your email first so we know where to send the alert." });
      }

      // authenticateUser requires Supabase's confirmed-email timestamp, so a
      // session cannot mark an unconfirmed address as verified here.
      if (body.action === "resend-verification") {
        const record = await getSubscriber(email);
        if (record) await markVerified(email);
        return res.status(200).json({ ok: true, alreadyVerified: true });
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
        await markVerified(email);
        return res.status(200).json({ ok: true, ...outcome, watches });
      }
      // logged / invalid / unreachable / at_capacity — report honestly.
      return res.status(outcome.status === "logged" ? 200 : 422).json({ ok: outcome.status === "logged", ...outcome });
    }

    if (!isValidEmail(profile.email)) {
      return res.status(400).json({ error: "Use a properly formatted email address." });
    }

    // Throttle before writing. New records cost more storage and pipeline work,
    // so that path is capped harder than an owner editing an existing profile.
    const requester = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
    const alreadyKnown = Boolean(await getSubscriber(profile.email));
    const slot = await takeSubscribeSlot(requester, { isNewAddress: !alreadyKnown });
    if (!slot.allowed) {
      return res.status(429).json({
        error: slot.reason === "new-address"
          ? "Too many new sign-ups from this connection. Try again in an hour."
          : "You're saving a bit too fast — give it a moment and try again.",
      });
    }

    const result = await saveSubscriber(profile, body.subscription || null);
    // A confirmed Supabase user already proves control of this account's
    // email, so do not send a second verification message through another
    // provider.
    if (result.saved) await markVerified(auth.email);
    const verified = Boolean(result.saved);

    return res.status(result.saved ? 200 : 202).json({
      ok: true,
      saved: result.saved,
      verified,
      verificationSent: false,
      setupRequired: result.setupRequired,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Could not save subscriber." });
  }
};

module.exports = withCors(handler);

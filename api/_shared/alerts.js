const webpush = require("web-push");
const { clearPushSubscription } = require("./store");
const { isSafePushSubscription } = require("./push-target");
const { REASONS: LISTING_REPORT_REASONS } = require("./reports");
const { recordEmailOutcome, fromAddress } = require("./email-health");
// Shared with the browser (geo.js is dual-mode) so the radius an alert uses is
// the same engine the app shows results with.
const geo = require("../../geo.js");

// Send a push and, if the endpoint is permanently gone (404/410 — the phone
// unsubscribed or the browser rotated the endpoint), drop the dead
// subscription so future runs stop wasting sends on it.
async function pushWithPruning(subscriber, payload) {
  // Defence in depth: a stored subscription should already have been validated
  // on the way in, but never let a bad endpoint reach the network layer.
  if (!isSafePushSubscription(subscriber.pushSubscription)) {
    try { await clearPushSubscription(subscriber.email); } catch {}
    return { sent: false, rejected: true };
  }
  try {
    await webpush.sendNotification(subscriber.pushSubscription, JSON.stringify(payload));
    return { sent: true };
  } catch (error) {
    if ([404, 410].includes(error.statusCode)) {
      try { await clearPushSubscription(subscriber.email); } catch {}
      return { sent: false, pruned: true };
    }
    throw error;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function safeOfficialUrl(value = "") {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function openingHtml(opening, subscriber) {
  const name = escapeHtml(subscriber.name || "there");
  const company = escapeHtml(opening.company);
  const role = escapeHtml(opening.role);
  const field = escapeHtml(opening.field || "career");
  const program = escapeHtml(opening.program || "Internship");
  const deadline = escapeHtml(opening.deadline || "Check posting");
  const location = escapeHtml(opening.location || "See posting");
  const sourceUrl = safeOfficialUrl(opening.sourceUrl);
  const buttonLabel = opening.browse ? `Browse ${company} Careers` : "Open Official Posting";
  const sourceAction = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" style="display:inline-block;background:#6841ff;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;padding:13px 18px;margin:0 0 18px">${buttonLabel}</a>`
    : `<p style="color:#5b5870">Promptly has not verified a direct posting link for this alert yet.</p>`;

  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="margin:0 0 12px;font-size:28px">${company} ${role} just opened.</h1>
    <p>Hey ${name}, Promptly matched this opening to your ${field} alerts.</p>
    <div style="background:#f4f1ff;border:1px solid #ded6ff;border-radius:16px;padding:18px;margin:20px 0">
      <strong>${company}</strong><br />${role} · ${program}<br />Location: ${location}<br />Deadline: ${deadline}
    </div>
    ${sourceAction}
    <p style="margin-top:0">Promptly alerts you to openings. Applications happen on the employer's official site.</p>
    <p style="color:#5b5870">You are receiving this because you signed up for Promptly alerts.</p>
  </div>`;
}

function safeUrl(value = "") {
  const url = safeOfficialUrl(value);
  return url ? escapeHtml(url) : "";
}

function alertCard(opening) {
  const company = escapeHtml(opening.company);
  const role = escapeHtml(opening.role);
  const program = escapeHtml(opening.program || "Internship");
  const deadline = escapeHtml(opening.deadline || "Check posting");
  const url = safeUrl(opening.sourceUrl);
  const linkLabel = opening.browse ? `Browse ${company} careers` : "View official posting";
  return `<div style="background:#f4f1ff;border:1px solid #ded6ff;border-radius:14px;padding:16px;margin:12px 0">
    <strong>${company}</strong><br />${role} · ${program}<br />
    <span style="color:#5b5870">Deadline: ${deadline}</span>
    ${url ? `<br /><a href="${url}" style="display:inline-block;margin-top:10px;color:#5b35e8;font-weight:700">${linkLabel}</a>` : ""}
  </div>`;
}

function weeklyRecapHtml(openings, subscriber) {
  const name = escapeHtml(subscriber.name || "there");
  const fields = Array.isArray(subscriber.fields) && subscriber.fields.length
    ? escapeHtml(subscriber.fields.slice(0, 4).join(", "))
    : "your interests";
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:600px;margin:0 auto;padding:24px">
    <p style="color:#6d48ff;font-weight:800;margin:0 0 8px">YOUR PROMPTLY WEEKLY RECAP</p>
    <h1 style="margin:0 0 12px;font-size:28px">${openings.length} matches worth reviewing.</h1>
    <p>Hey ${name}, here are the strongest current alerts for ${fields}. Promptly only links to employer sources.</p>
    ${openings.map(alertCard).join("")}
    <p style="color:#5b5870">You can adjust recap and reminder settings from your Promptly profile.</p>
  </div>`;
}

function deadlineReminderHtml(opening, subscriber, daysLeft) {
  const name = escapeHtml(subscriber.name || "there");
  const timing = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
    <p style="color:#6d48ff;font-weight:800;margin:0 0 8px">SAVED ALERT REMINDER</p>
    <h1 style="margin:0 0 12px;font-size:28px">${escapeHtml(opening.company)} closes ${timing}.</h1>
    <p>Hey ${name}, you saved this alert and asked Promptly to keep the deadline visible.</p>
    ${alertCard(opening)}
  </div>`;
}

// Public base URL for links inside emails. Configurable so preview deployments
// don't mint links pointing at production.
function appBaseUrl() {
  const configured = process.env.PUBLIC_APP_URL || process.env.APP_BASE_URL;
  if (configured) return String(configured).replace(/\/+$/, "");
  return "https://app.joinpromptly.co";
}

function unsubscribeUrl(token) {
  return `${appBaseUrl()}/api/subscribe?action=unsubscribe&token=${encodeURIComponent(token)}`;
}

// Every alert email carries a working opt-out: a visible footer link plus the
// List-Unsubscribe headers mailbox providers look for. Without these a
// recipient's only recourse is marking us as spam.
function unsubscribeFooter(unsubToken) {
  if (!unsubToken) return "";
  const url = escapeHtml(unsubscribeUrl(unsubToken));
  return `<p style="color:#8a879c;font-size:12px;margin-top:26px;border-top:1px solid #e6e3f0;padding-top:14px">
    Don't want these? <a href="${url}" style="color:#5b35e8">Unsubscribe in one click</a>.
  </p>`;
}

async function sendEmail({ to, subject, html, unsubToken, kind }) {
  if (!process.env.RESEND_API_KEY) {
    const result = { sent: false, setupRequired: "Add RESEND_API_KEY in Vercel." };
    await recordEmailOutcome(kind, result);
    return result;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = fromAddress();

  const payload = { from, to: [to], subject, html: html + unsubscribeFooter(unsubToken) };
  if (unsubToken) {
    payload.headers = {
      "List-Unsubscribe": `<${unsubscribeUrl(unsubToken)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  // Awaited, not fire-and-forget: the serverless runtime can be torn down the
  // moment the handler returns, which would drop the record silently.
  const { data, error } = await resend.emails.send(payload);
  if (error) {
    const failure = { sent: false, error: error.message || "Email failed." };
    await recordEmailOutcome(kind, failure);
    return failure;
  }
  const success = { sent: true, id: data && data.id };
  await recordEmailOutcome(kind, success);
  return success;
}

// Confirmation email. This is the ONLY message we will send to an address that
// has not yet proved it wants to hear from us, so it carries no alert content.
function verifyEmailHtml(name, url) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(url);
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="margin:0 0 12px;font-size:26px">Confirm your Promptly alerts</h1>
    <p>Hi ${safeName}, tap below to turn on internship alerts for this address.</p>
    <a href="${safeUrl}" style="display:inline-block;background:#6841ff;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;padding:13px 18px;margin:18px 0">Confirm my email</a>
    <p style="color:#5b5870">Until you confirm, we will not send you any alerts.</p>
    <p style="color:#5b5870;font-size:13px">If you did not sign up for Promptly, ignore this email and nothing further will be sent to you.</p>
  </div>`;
}

// Reminder for a record that still hasn't been confirmed. Says plainly what
// happens if they ignore it — no dark patterns, no fake urgency.
function verifyReminderHtml(name, url, daysLeft) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(url);
  const when = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="margin:0 0 12px;font-size:26px">Your Promptly alerts are still switched off</h1>
    <p>Hi ${safeName}, you set up Promptly but never confirmed this email, so we haven't sent you a single alert.</p>
    <a href="${safeUrl}" style="display:inline-block;background:#6841ff;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;padding:13px 18px;margin:18px 0">Confirm and turn on alerts</a>
    <p style="color:#5b5870">If you don't confirm, we'll delete this profile ${when} and stop emailing you. Nothing is kept.</p>
    <p style="color:#5b5870;font-size:13px">Didn't sign up for Promptly? Ignore this and the profile disappears on its own.</p>
  </div>`;
}

async function sendVerificationReminder(subscriber, token, daysLeft) {
  const url = `${appBaseUrl()}/api/subscribe?action=verify&token=${encodeURIComponent(token)}`;
  return sendEmail({
    kind: "verification-reminder",
    to: subscriber.email,
    subject: `Confirm your email or your Promptly profile will be deleted`,
    html: verifyReminderHtml(subscriber.name, url, daysLeft),
  });
}

async function sendVerificationEmail(subscriber, token) {
  const url = `${appBaseUrl()}/api/subscribe?action=verify&token=${encodeURIComponent(token)}`;
  return sendEmail({
    kind: "verification",
    to: subscriber.email,
    subject: "Confirm your Promptly alerts",
    html: verifyEmailHtml(subscriber.name, url),
    // deliberately no unsubscribe footer: nothing is subscribed yet
  });
}

async function sendEmailAlert(opening, subscriber, unsubToken) {
  return sendEmail({
    kind: "instant-alert",
    to: subscriber.email,
    subject: `${opening.company} ${opening.role} just opened`,
    html: openingHtml(opening, subscriber),
    unsubToken,
  });
}

function dailyDigestHtml(openings, subscriber) {
  const name = escapeHtml(subscriber.name || "there");
  const shown = openings.slice(0, 12);
  const extra = openings.length - shown.length;
  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:600px;margin:0 auto;padding:24px">
    <p style="color:#6d48ff;font-weight:800;margin:0 0 8px">YOUR PROMPTLY DAILY DIGEST</p>
    <h1 style="margin:0 0 12px;font-size:28px">${openings.length} new opening${openings.length === 1 ? "" : "s"} matched your alerts.</h1>
    <p>Hey ${name}, these opened in the last day. Rolling deadlines fill fast, so the earlier you apply, the better.</p>
    ${shown.map(alertCard).join("")}
    ${extra > 0 ? `<p style="color:#5b5870">+ ${extra} more matches are waiting in your Promptly feed.</p>` : ""}
    <p style="color:#5b5870">One email a day, only when there is something new. Adjust alerts from your Promptly profile.</p>
  </div>`;
}

async function sendDailyDigest(openings, subscriber, unsubToken) {
  return sendEmail({
    kind: "daily-digest",
    to: subscriber.email,
    subject: `${openings.length} new internship${openings.length === 1 ? "" : "s"} just opened in your field`,
    html: dailyDigestHtml(openings, subscriber),
    unsubToken,
  });
}

async function sendWeeklyRecap(openings, subscriber, unsubToken) {
  return sendEmail({
    kind: "weekly-recap",
    to: subscriber.email,
    subject: `Your Promptly weekly recap: ${openings.length} matches`,
    html: weeklyRecapHtml(openings, subscriber),
    unsubToken,
  });
}

async function sendDeadlineReminder(opening, subscriber, daysLeft, unsubToken) {
  const timing = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  return sendEmail({
    kind: "deadline-reminder",
    to: subscriber.email,
    subject: `${opening.company} closes ${timing}`,
    html: deadlineReminderHtml(opening, subscriber, daysLeft),
    unsubToken,
  });
}

async function sendPushAlert(opening, subscriber) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@example.com";

  if (!subscriber.pushSubscription) return { sent: false, skipped: "No phone subscription saved." };
  if (!publicKey || !privateKey) return { sent: false, setupRequired: "Add VAPID push keys in Vercel." };

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return pushWithPruning(subscriber, {
    title: "Promptly",
    body: `${opening.company} ${opening.role} just opened.`,
    url: safeOfficialUrl(opening.sourceUrl) || "/",
  });
}

async function sendDeadlinePush(opening, subscriber, daysLeft) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@example.com";
  if (!subscriber.pushSubscription) return { sent: false, skipped: "No phone subscription saved." };
  if (!publicKey || !privateKey) return { sent: false, setupRequired: "Add VAPID push keys in Vercel." };
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const timing = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  return pushWithPruning(subscriber, {
    title: "Promptly deadline reminder",
    body: `${opening.company} ${opening.role} closes ${timing}.`,
    url: safeOfficialUrl(opening.sourceUrl) || "/",
  });
}

// How far an alert may reach. The app itself widens its radius step by step
// and explains when it does; a push notification has no room to explain, so it
// only fires for something plausibly actionable. Remote still comes through
// below, which is what keeps rural subscribers from getting nothing.
const ALERT_RADIUS_MILES = 100;

// Location gate for alerts.
//
// This did not exist: matchesOpening considered only fields and watches, so a
// subscriber in Hartford who had NOT ticked "willing to relocate" would still
// be emailed and pushed roles in Dallas. The app filtered by distance; the
// alerts that are the actual product did not.
function locationMatches(opening, subscriber) {
  const preferred = String(subscriber.preferredLocation || "").trim();
  if (!preferred || /^no preference$/i.test(preferred)) return true;
  if (subscriber.willingToRelocate === true) return true;

  const remoteOk = subscriber.remoteNotifications !== false && subscriber.remoteOkay !== false;
  if (remoteOk && (opening.remote === true || geo.isRemoteText(opening.location))) return true;

  const listing = String(opening.location || "").trim();
  if (!listing) return true; // nothing to compare — don't drop it on a guess

  const from = geo.resolve(preferred);
  const to = geo.resolve(listing);
  if (!from || !to || from.kind !== "point" || to.kind !== "point") {
    // Unresolvable either side: fall back to name matching rather than
    // silently withholding alerts the subscriber signed up for.
    const tokens = preferred.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
    if (!tokens.length) return true;
    const haystack = listing.toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  }
  return geo.milesBetween(from, to) <= ALERT_RADIUS_MILES;
}

function matchesOpening(opening, subscriber) {
  // A company the subscriber explicitly asked Promptly to watch always
  // matches, regardless of their field filters — that's the whole point of a
  // watch. Compare case-insensitively on company name.
  if (Array.isArray(subscriber.watches) && subscriber.watches.length) {
    const company = String(opening.company || "").trim().toLowerCase();
    if (company && subscriber.watches.some((w) => String(w.company || "").trim().toLowerCase() === company)) {
      return true;
    }
  }
  // Field match and location must BOTH hold for a normal alert.
  if (!locationMatches(opening, subscriber)) return false;
  if (!opening.field) return true;
  if (!Array.isArray(subscriber.fields) || subscriber.fields.length === 0) return true;
  return subscriber.fields.includes(opening.field);
}

// ── Listing-problem report → the team's own inbox ─────────────────────────
// REPORT_TO_EMAIL can override this for previews or a future support desk,
// but production reports have a real destination without extra setup.
const DEFAULT_REPORT_TO_EMAIL = "help.promptly@gmail.com";

function buildListingReportEmail(report) {
  const to = process.env.REPORT_TO_EMAIL || DEFAULT_REPORT_TO_EMAIL;
  const esc = escapeHtml;
  const reasons = (report.reasons || [])
    .map((reason) => LISTING_REPORT_REASONS[reason] || String(reason))
    .join(", ");
  const notes = (report.notes || [])
    .map((n) => `<li>${esc(n.note)}</li>`)
    .join("");
  const officialUrl = safeOfficialUrl(report.url);
  const company = String(report.company || "Unknown company").replace(/[\r\n]+/g, " ").trim();

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px">
    <h2 style="margin:0 0 6px">Listing reported${report.count > 1 ? ` (${report.count}×)` : ""}</h2>
    <p style="margin:0 0 16px;color:#5b5870">A student flagged a problem with a live listing.</p>
    <p><strong>${esc(company)}</strong><br />${esc(report.role || "—")}</p>
    <p><strong>Current location:</strong> ${esc(report.location || "Not provided")}</p>
    <p><strong>Reason:</strong> ${esc(reasons)}</p>
    ${notes ? `<p><strong>Notes:</strong></p><ul>${notes}</ul>` : ""}
    ${officialUrl ? `<p><a href="${esc(officialUrl)}">Open the reported listing</a></p>` : ""}
    ${report.lastReporterEmail ? `<p style="color:#5b5870">Reporter: ${esc(report.lastReporterEmail)}</p>` : ""}
    <p style="color:#5b5870;font-size:13px">Nothing was removed automatically — review it in /admin.html.</p>
  </div>`;

  return { to, subject: `Promptly: ${company} listing reported`, html };
}

// Awaited by the API handler so Vercel does not freeze the function before
// Resend has accepted the message.
async function sendListingReport(report) {
  return sendEmail({ ...buildListingReportEmail(report), kind: "listing-report" });
}

module.exports = {
  sendVerificationEmail,
  sendVerificationReminder,
  sendListingReport,
  buildListingReportEmail,
  DEFAULT_REPORT_TO_EMAIL,
  appBaseUrl,
  unsubscribeUrl,
  sendEmailAlert,
  sendPushAlert,
  sendDailyDigest,
  sendWeeklyRecap,
  sendDeadlineReminder,
  sendDeadlinePush,
  matchesOpening,
  openingHtml,
  safeOfficialUrl,
};

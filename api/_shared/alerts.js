const webpush = require("web-push");
const { clearPushSubscription } = require("./store");

// Send a push and, if the endpoint is permanently gone (404/410 — the phone
// unsubscribed or the browser rotated the endpoint), drop the dead
// subscription so future runs stop wasting sends on it.
async function pushWithPruning(subscriber, payload) {
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
  const sourceAction = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" style="display:inline-block;background:#6841ff;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;padding:13px 18px;margin:0 0 18px">Open Official Posting</a>`
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
  return `<div style="background:#f4f1ff;border:1px solid #ded6ff;border-radius:14px;padding:16px;margin:12px 0">
    <strong>${company}</strong><br />${role} · ${program}<br />
    <span style="color:#5b5870">Deadline: ${deadline}</span>
    ${url ? `<br /><a href="${url}" style="display:inline-block;margin-top:10px;color:#5b35e8;font-weight:700">View official posting</a>` : ""}
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

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, setupRequired: "Add RESEND_API_KEY in Vercel." };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.ALERT_FROM_EMAIL || "Promptly <onboarding@resend.dev>";
  const { data, error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) return { sent: false, error: error.message || "Email failed." };
  return { sent: true, id: data && data.id };
}

async function sendEmailAlert(opening, subscriber) {
  return sendEmail({
    to: subscriber.email,
    subject: `${opening.company} ${opening.role} just opened`,
    html: openingHtml(opening, subscriber),
  });
}

async function sendWeeklyRecap(openings, subscriber) {
  return sendEmail({
    to: subscriber.email,
    subject: `Your Promptly weekly recap: ${openings.length} matches`,
    html: weeklyRecapHtml(openings, subscriber),
  });
}

async function sendDeadlineReminder(opening, subscriber, daysLeft) {
  const timing = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  return sendEmail({
    to: subscriber.email,
    subject: `${opening.company} closes ${timing}`,
    html: deadlineReminderHtml(opening, subscriber, daysLeft),
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

function matchesOpening(opening, subscriber) {
  if (!opening.field) return true;
  if (!Array.isArray(subscriber.fields) || subscriber.fields.length === 0) return true;
  return subscriber.fields.includes(opening.field);
}

module.exports = {
  sendEmailAlert,
  sendPushAlert,
  sendWeeklyRecap,
  sendDeadlineReminder,
  sendDeadlinePush,
  matchesOpening,
  openingHtml,
  safeOfficialUrl,
};

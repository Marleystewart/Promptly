const webpush = require("web-push");

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
  const sourceUrl = safeOfficialUrl(opening.sourceUrl);
  const sourceAction = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" style="display:inline-block;background:#6841ff;color:#fff;text-decoration:none;font-weight:700;border-radius:8px;padding:13px 18px;margin:0 0 18px">Open Official Posting</a>`
    : `<p style="color:#5b5870">Promptly has not verified a direct posting link for this alert yet.</p>`;

  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="margin:0 0 12px;font-size:28px">${company} ${role} just opened.</h1>
    <p>Hey ${name}, Promptly matched this opening to your ${field} alerts.</p>
    <div style="background:#f4f1ff;border:1px solid #ded6ff;border-radius:16px;padding:18px;margin:20px 0">
      <strong>${company}</strong><br />${role} · ${program}<br />Deadline: ${deadline}
    </div>
    ${sourceAction}
    <p style="margin-top:0">Promptly alerts you to openings. Applications happen on the employer's official site.</p>
    <p style="color:#5b5870">You are receiving this because you signed up for Promptly alerts.</p>
  </div>`;
}

async function sendEmailAlert(opening, subscriber) {
  if (!process.env.RESEND_API_KEY) {
    return { sent: false, setupRequired: "Add RESEND_API_KEY in Vercel." };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.ALERT_FROM_EMAIL || "Promptly <onboarding@resend.dev>";

  const { data, error } = await resend.emails.send({
    from,
    to: [subscriber.email],
    subject: `${opening.company} ${opening.role} just opened`,
    html: openingHtml(opening, subscriber),
  });

  if (error) return { sent: false, error: error.message || "Email failed." };
  return { sent: true, id: data && data.id };
}

async function sendPushAlert(opening, subscriber) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@example.com";

  if (!subscriber.pushSubscription) return { sent: false, skipped: "No phone subscription saved." };
  if (!publicKey || !privateKey) return { sent: false, setupRequired: "Add VAPID push keys in Vercel." };

  webpush.setVapidDetails(subject, publicKey, privateKey);
  await webpush.sendNotification(
    subscriber.pushSubscription,
    JSON.stringify({
      title: "Promptly",
      body: `${opening.company} ${opening.role} just opened.`,
      url: safeOfficialUrl(opening.sourceUrl) || "/",
    })
  );

  return { sent: true };
}

function matchesOpening(opening, subscriber) {
  if (!opening.field) return true;
  if (!Array.isArray(subscriber.fields) || subscriber.fields.length === 0) return true;
  return subscriber.fields.includes(opening.field);
}

module.exports = { sendEmailAlert, sendPushAlert, matchesOpening, openingHtml, safeOfficialUrl };

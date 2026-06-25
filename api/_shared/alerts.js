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

function openingHtml(opening, subscriber) {
  const name = escapeHtml(subscriber.name || "there");
  const company = escapeHtml(opening.company);
  const role = escapeHtml(opening.role);
  const field = escapeHtml(opening.field || "career");
  const program = escapeHtml(opening.program || "Internship");
  const deadline = escapeHtml(opening.deadline || "Check posting");

  return `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
    <h1 style="margin:0 0 12px;font-size:28px">${company} ${role} just opened.</h1>
    <p>Hey ${name}, Promptly matched this opening to your ${field} alerts.</p>
    <div style="background:#f4f1ff;border:1px solid #ded6ff;border-radius:16px;padding:18px;margin:20px 0">
      <strong>${company}</strong><br />${role} · ${program}<br />Deadline: ${deadline}
    </div>
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
      url: "/",
    })
  );

  return { sent: true };
}

function matchesOpening(opening, subscriber) {
  if (!opening.field) return true;
  return Array.isArray(subscriber.fields) && subscriber.fields.includes(opening.field);
}

module.exports = { sendEmailAlert, sendPushAlert, matchesOpening };

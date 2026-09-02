// The daily "is Promptly actually working?" email.
//
// Every health signal Promptly collects — source status, email deliverability,
// the USAJOBS probe, and now cron outcomes — lived behind /admin.html, which
// only helps if somebody remembers to open it. A pipeline that quietly stops
// delivering looks identical to a quiet week until a student complains.
//
// This is a dead man's switch, so it sends EVERY day rather than only when
// something breaks. An alerts-only design cannot distinguish "healthy" from
// "the thing that sends the alerts is itself dead" — silence would be the
// symptom of both. The subject line carries the state, so it can be read from a
// notification without opening anything, and a missing email is itself a signal.

const { getLiveOpenings } = require("./openings-store");
const { readEmailHealth } = require("./email-health");
const { readRunHealth } = require("./run-health");
const { listSourceHealth, stateFor } = require("./source-health");
const { sendEmail, DEFAULT_REPORT_TO_EMAIL, appBaseUrl } = require("./alerts");

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function hoursSince(iso, now) {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? (now - t) / 3600000 : null;
}

// Everything worth waking someone up for, in one place. Each entry is a
// sentence a tired person can act on, not a metric to interpret.
async function collectHeartbeat({ now = Date.now(), retentionStats = null } = {}) {
  const problems = [];
  const facts = {};

  const runHealth = await readRunHealth(now).catch(() => ({ runs: [], problems: [], healthy: true }));
  problems.push(...runHealth.problems);
  facts.runs = runHealth.runs;

  // The feed itself. Zero listings is the loudest possible failure: the app
  // renders, looks fine, and promises nothing.
  let live = [];
  try { live = await getLiveOpenings(); } catch {}
  const openings = Array.isArray(live) ? live : (live && live.openings) || [];
  facts.listings = openings.length;
  if (!openings.length) problems.push("The live feed has zero listings.");

  // Can email reach a student at all? This is the check that would have caught
  // the sandbox-sender outage weeks earlier.
  let email = null;
  try { email = await readEmailHealth(); } catch {}
  facts.email = email;
  if (email && email.canReachRealUsers === false) {
    problems.push(`Email cannot reach students: ${email.blockedReason || "unknown reason"}`);
  }
  const successAge = email && hoursSince(email.lastSuccessAt, now);
  if (email && email.lastSuccessAt && successAge > 48) {
    problems.push(`No email has sent successfully in ${Math.round(successAge)} hours.`);
  }

  // Broken sources are the failure that degrades Promptly gradually rather than
  // all at once: a custom scraper stops reading one employer after a redesign,
  // that company quietly vanishes from the feed, and every other number still
  // looks fine. "Quiet" is deliberately NOT counted — most campus boards are
  // genuinely empty outside Sept–Nov, and treating that as breakage would make
  // the heartbeat cry wolf every summer until nobody reads it.
  try {
    const sources = await listSourceHealth();
    const broken = sources.filter((s) => stateFor(s) === "broken");
    facts.sources = {
      total: sources.length,
      broken: broken.length,
      quiet: sources.filter((s) => stateFor(s) === "quiet").length,
    };
    if (broken.length) {
      const worst = [...broken]
        .sort((a, b) => Date.parse(a.brokeAt || 0) - Date.parse(b.brokeAt || 0))
        .slice(0, 5)
        .map((s) => s.company)
        .join(", ");
      problems.push(
        `${broken.length} source${broken.length === 1 ? "" : "s"} stopped producing listings` +
        `${worst ? ` (${worst}${broken.length > 5 ? ", …" : ""})` : ""}.`
      );
    }
  } catch {}

  if (retentionStats) facts.retention = retentionStats;

  return { healthy: problems.length === 0, problems, facts };
}

function row(label, value) {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#5b5870;white-space:nowrap">${escapeHtml(label)}</td>
    <td style="padding:6px 0;font-weight:700">${escapeHtml(value)}</td>
  </tr>`;
}

function buildHeartbeatEmail({ healthy, problems, facts }, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const subject = healthy
    ? `Promptly OK — ${facts.listings} listings live`
    : `Promptly NEEDS ATTENTION — ${problems.length} problem${problems.length === 1 ? "" : "s"}`;

  const problemList = problems.length
    ? `<div style="background:#fdecef;border-left:4px solid #c62740;padding:14px 16px;margin:0 0 20px">
         <p style="margin:0 0 8px;font-weight:800;color:#a01d32">Needs attention</p>
         <ul style="margin:0;padding-left:18px;color:#7a1526">
           ${problems.map((p) => `<li style="margin-bottom:5px">${escapeHtml(p)}</li>`).join("")}
         </ul>
       </div>`
    : `<div style="background:#e7f6ee;border-left:4px solid #17805a;padding:14px 16px;margin:0 0 20px">
         <p style="margin:0;font-weight:800;color:#116045">Everything is running.</p>
       </div>`;

  const runRows = (facts.runs || []).map((r) => {
    const when = r.everRan
      ? `${r.ageMinutes} min ago${r.ok ? "" : " (failed)"}`
      : "never";
    const detail = Object.entries(r.stats || {})
      .filter(([, v]) => typeof v === "number" && v > 0)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ");
    return row(r.name, detail ? `${when} — ${detail}` : when);
  }).join("");

  const emailLine = facts.email
    ? (facts.email.canReachRealUsers ? `sending as ${facts.email.from}` : "BLOCKED")
    : "unknown";

  return {
    to: process.env.ADMIN_ALERT_EMAIL || DEFAULT_REPORT_TO_EMAIL,
    subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#14141f;max-width:560px;margin:0 auto;padding:24px">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6841ff;font-weight:800">Promptly daily check · ${escapeHtml(day)}</p>
      <h1 style="margin:0 0 18px;font-size:24px">${healthy ? "All systems running" : "Something needs you"}</h1>
      ${problemList}
      <table style="border-collapse:collapse;font-size:14px;width:100%">
        ${row("Listings live", String(facts.listings))}
        ${facts.sources ? row("Sources", `${facts.sources.total - facts.sources.broken}/${facts.sources.total} healthy${facts.sources.quiet ? ` · ${facts.sources.quiet} quiet` : ""}`) : ""}
        ${row("Email", emailLine)}
        ${runRows}
      </table>
      <p style="color:#5b5870;font-size:13px;margin:22px 0 0">
        This email sends every day whether or not anything is wrong. If it stops
        arriving, the daily cron itself has stopped — treat that as a problem.
      </p>
      <p style="margin:12px 0 0"><a href="${escapeHtml(appBaseUrl())}/admin.html" style="color:#6841ff;font-weight:700">Open the dashboard</a></p>
    </div>`,
  };
}

// Collect, build, send. Awaited by the caller so the serverless runtime is not
// torn down before Resend has accepted the message — the same reason
// sendListingReport is awaited.
async function sendHeartbeat({ now = Date.now(), retentionStats = null } = {}) {
  const report = await collectHeartbeat({ now, retentionStats });
  const email = buildHeartbeatEmail(report, now);
  // No unsubToken: operational mail to the operator, not marketing to a
  // subscriber, so it must not be unsubscribable by accident.
  //
  // record:false is the important flag. This email reaches the Resend account
  // owner, which even the sandbox sender could always do, so letting it update
  // lastSuccessAt would permanently satisfy the "no email has sent in 48 hours"
  // check below — the heartbeat would mask the outage it exists to report.
  const result = await sendEmail({ ...email, kind: "heartbeat", record: false });
  return { sent: Boolean(result && result.sent), healthy: report.healthy, problems: report.problems };
}

module.exports = { collectHeartbeat, buildHeartbeatEmail, sendHeartbeat };

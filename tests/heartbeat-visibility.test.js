// The daily check has to be visible without email.
//
// The heartbeat has run since before today, but it reported to an inbox only.
// Two problems with that. Nobody was reading it, because it goes to
// help.promptly@gmail.com unless ADMIN_ALERT_EMAIL is set. And email is one of
// the things the heartbeat CHECKS — so in the exact case where it has something
// urgent to say about email, the report saying so cannot be delivered.
//
// It also could not answer the most basic question of all: does the site load?
// Every other check reads our own internal state, which a broken deploy leaves
// completely untouched.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const heartbeat = fs.readFileSync(path.join(ROOT, "api/_shared/heartbeat.js"), "utf8");
const admin = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
const { checkSiteLoads } = require("../api/_shared/heartbeat");

// ── The site check ───────────────────────────────────────────────────────
// A 200 is not enough. A broken build happily returns 200 with an empty shell.
assert.match(heartbeat, /if \(!response\.ok\)/, "a non-200 is a failure");
assert.match(heartbeat, /body\.length < 1000/, "a near-empty page is a failure even at 200");
assert.match(heartbeat, /id="view-openings"/, "the app shell must actually be present");
assert.match(heartbeat, /AbortController/, "the fetch must time out, or it hangs the cron that sends digests");

// It has to be able to fail. Point it at a host that cannot resolve.
(async () => {
  const saved = process.env.PUBLIC_APP_URL;
  process.env.PUBLIC_APP_URL = "https://promptly-does-not-exist.invalid";
  const bad = await checkSiteLoads();
  assert.equal(bad.ok, false, "an unreachable site must report not-ok");
  assert.ok(bad.reason, "and must say why, in words someone can act on");
  if (saved === undefined) delete process.env.PUBLIC_APP_URL; else process.env.PUBLIC_APP_URL = saved;

  // ── Stored, so the dashboard does not depend on email ──────────────────
  assert.match(heartbeat, /await storeHeartbeat\(/, "the verdict is stored every run");
  assert.match(heartbeat, /emailed: sent/, "and records whether the email actually went out");
  const sendBody = heartbeat.slice(heartbeat.indexOf("async function sendHeartbeat"));
  assert.ok(
    sendBody.indexOf("await sendEmail(") < sendBody.indexOf("storeHeartbeat("),
    "store after sending, so `emailed` reflects what really happened"
  );
  assert.match(heartbeat, /ex: 8 \* 86400/,
    "the snapshot expires — a green banner from last week is worse than no banner");

  // ── The banner ─────────────────────────────────────────────────────────
  assert.match(admin, /d\.heartbeat/, "the dashboard reads the stored verdict");
  assert.ok(
    admin.indexOf("${heartbeatBanner}") < admin.indexOf("${emailBanner}"),
    "the daily check sits above everything else on the page"
  );
  // Staleness is the subtle one: a healthy verdict that stopped updating still
  // renders green unless age is checked, which is the exact failure a dead
  // man's switch exists to catch.
  assert.match(admin, /hbAgeHours > 26/, "a verdict older than a day reads as stale, not as healthy");
  assert.match(admin, /hbState = !hb \? "missing"/, "never having run is its own state");
  assert.match(admin, /escapeHtml\(p\)/, "problem text is escaped before it reaches the DOM");

  // ── Schedule ───────────────────────────────────────────────────────────
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  const daily = vercel.crons.find((c) => c.path === "/api/retention");
  assert.equal(daily.schedule, "0 16 * * *", "16:00 UTC is noon Eastern during daylight saving");

  // The digest claim key rides on this cron and assumes it fires mid-day US.
  const retention = fs.readFileSync(path.join(ROOT, "api/retention.js"), "utf8");
  assert.match(retention, /16:00 UTC/, "the comment explaining the UTC key must track the real schedule");

  console.log("Heartbeat visibility tests passed. The check reaches the dashboard, and a stale verdict is not green.");
})().catch((error) => { console.error(error); process.exitCode = 1; });

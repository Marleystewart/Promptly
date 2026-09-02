// The daily heartbeat is the only thing that carries a failure to a human
// without someone remembering to open a dashboard. So the cases that matter are
// the failures: if it reports "OK" while the pipeline is dead, it is worse than
// nothing, because it actively reassures.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");

const ROOT = path.join(__dirname, "..");

// Stub the modules the heartbeat reads, so we can drive it into each failure
// state without a Redis or a Resend account.
const stubs = new Map();
const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  for (const [suffix, value] of stubs) {
    if (request.endsWith(suffix)) return value;
  }
  return originalLoad(request, parent, isMain);
};

function withState({ runs = [], problems = [], listings = 100, email = null }) {
  stubs.set("./openings-store", { getLiveOpenings: async () => ({ openings: new Array(listings).fill({}) }) });
  stubs.set("./email-health", { readEmailHealth: async () => email });
  stubs.set("./run-health", { readRunHealth: async () => ({ runs, problems, healthy: !problems.length }) });
  stubs.set("./alerts", {
    sendEmail: async () => ({ sent: true }),
    DEFAULT_REPORT_TO_EMAIL: "help.promptly@gmail.com",
    appBaseUrl: () => "https://app.joinpromptly.co",
  });
  delete require.cache[require.resolve("../api/_shared/heartbeat.js")];
  return require("../api/_shared/heartbeat.js");
}

async function run() {
  const HEALTHY_EMAIL = {
    canReachRealUsers: true,
    from: "Promptly <alerts@joinpromptly.co>",
    lastSuccessAt: new Date().toISOString(),
  };

  // 1. Healthy: says so, and the subject is readable from a phone notification.
  {
    const { collectHeartbeat, buildHeartbeatEmail } = withState({ email: HEALTHY_EMAIL, listings: 872 });
    const report = await collectHeartbeat({});
    assert.equal(report.healthy, true, "a healthy pipeline must report healthy");
    const mail = buildHeartbeatEmail(report);
    assert.match(mail.subject, /^Promptly OK/, "the healthy subject must lead with OK");
    assert.match(mail.subject, /872 listings/, "the subject must carry the headline number");
    assert.equal(mail.to, "help.promptly@gmail.com");
  }

  // 2. An empty feed is the loudest failure: the app still renders, and promises
  //    nothing. It must never read as healthy.
  {
    const { collectHeartbeat, buildHeartbeatEmail } = withState({ email: HEALTHY_EMAIL, listings: 0 });
    const report = await collectHeartbeat({});
    assert.equal(report.healthy, false, "zero listings is not healthy");
    assert.match(report.problems.join(" "), /zero listings/);
    assert.match(buildHeartbeatEmail(report).subject, /NEEDS ATTENTION/);
  }

  // 3. The sandbox-sender outage — the exact failure that ran for weeks unseen.
  {
    const { collectHeartbeat } = withState({
      email: { canReachRealUsers: false, blockedReason: "ALERT_FROM_EMAIL still uses Resend's sandbox sender.", from: "onboarding@resend.dev" },
    });
    const report = await collectHeartbeat({});
    assert.equal(report.healthy, false, "email that cannot reach students is not healthy");
    assert.match(report.problems.join(" "), /cannot reach students/);
  }

  // 4. A cron that has stopped firing. Its own problem sentence must survive.
  {
    const { collectHeartbeat } = withState({
      email: HEALTHY_EMAIL,
      problems: ["retention has not run since 2026-08-30T14:00:00.000Z — the schedule may have stopped."],
      runs: [{ name: "retention", everRan: true, ok: true, stale: true, ageMinutes: 4320, stats: {} }],
    });
    const report = await collectHeartbeat({});
    assert.equal(report.healthy, false, "a stale cron is not healthy");
    assert.match(report.problems.join(" "), /has not run since/);
  }

  // 5. Email that has not sent in days, even though it is configured correctly.
  {
    const threeDaysAgo = new Date(Date.now() - 72 * 3600 * 1000).toISOString();
    const { collectHeartbeat } = withState({
      email: { ...HEALTHY_EMAIL, lastSuccessAt: threeDaysAgo },
    });
    const report = await collectHeartbeat({});
    assert.equal(report.healthy, false, "silence for 3 days is a problem, not health");
    assert.match(report.problems.join(" "), /No email has sent successfully/);
  }

  // 6. Several problems at once are all reported, not just the first.
  {
    const { collectHeartbeat, buildHeartbeatEmail } = withState({
      listings: 0,
      email: { canReachRealUsers: false, blockedReason: "sandbox sender", from: "onboarding@resend.dev" },
      problems: ["retention has not run since yesterday."],
    });
    const report = await collectHeartbeat({});
    assert.equal(report.problems.length, 3, `expected 3 problems, got ${report.problems.length}`);
    assert.match(buildHeartbeatEmail(report).subject, /3 problems/);
  }
}

run().then(() => {
Module._load = originalLoad;

// The heartbeat must NOT record into the email-health record. It is delivered to
// the Resend account owner, which is the one address the broken sandbox sender
// could always reach — counting it would permanently satisfy the "no email has
// sent recently" check and mask the outage it exists to report.
{
  const heartbeat = fs.readFileSync(path.join(ROOT, "api/_shared/heartbeat.js"), "utf8");
  assert.match(heartbeat, /record: false/, "the heartbeat send must not update email health");
  const alerts = fs.readFileSync(path.join(ROOT, "api/_shared/alerts.js"), "utf8");
  assert.match(alerts, /record = true/, "sendEmail must default to recording for real student mail");
}

// Both crons must record their outcome, on success AND on failure. A run whose
// only trace is a 500 in a log nobody reads is how delivery stops silently.
for (const file of ["api/retention.js", "api/refresh-openings.js"]) {
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  assert.match(text, /recordRun\([^)]*ok: true/s, `${file} must record a successful run`);
  assert.match(text, /catch \(error\)[\s\S]*recordRun\([^)]*ok: false/, `${file} must record a failed run`);
}

// The heartbeat must never be able to take the cron down with it.
{
  const retention = fs.readFileSync(path.join(ROOT, "api/retention.js"), "utf8");
  assert.match(retention, /sendHeartbeat\([^)]*\)\.catch\(/, "a failing status email must not stop real alerts");
}

console.log("Heartbeat tests passed. Failures are reported, not smoothed over.");
}).catch((error) => { console.error(error); process.exit(1); });

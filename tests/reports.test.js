// Listing-report identity and validation. No network, no Redis.
//
// The two things that must hold: repeat reports of the SAME listing aggregate
// into one reviewable row (otherwise one broken link from a popular company
// floods the queue), and a junk reason can't be stored.

const assert = require("node:assert/strict");
const { reportId, isValidReason, REASONS } = require("../api/_shared/reports.js");
const {
  buildListingReportEmail,
  DEFAULT_REPORT_TO_EMAIL,
} = require("../api/_shared/alerts.js");

// ── Identity ──────────────────────────────────────────────────────────────
// Same listing → same id, so reports aggregate rather than pile up.
assert.strictEqual(
  reportId("Citi", "https://jobs.citi.com/job/123"),
  reportId("Citi", "https://jobs.citi.com/job/123"),
  "the same listing must always produce the same report id"
);
// Company name casing/whitespace is not a different listing.
assert.strictEqual(
  reportId("Citi", "https://jobs.citi.com/job/123"),
  reportId("  citi  ", "https://jobs.citi.com/job/123"),
  "casing and padding must not split one listing into two reports"
);
// Genuinely different listings must stay separate, or one report would
// silently stand in for another company's problem.
assert.notStrictEqual(
  reportId("Citi", "https://jobs.citi.com/job/123"),
  reportId("Citi", "https://jobs.citi.com/job/456"),
  "different postings at the same company are different reports"
);
assert.notStrictEqual(
  reportId("Citi", "https://jobs.citi.com/job/123"),
  reportId("JPMorgan", "https://jobs.citi.com/job/123"),
  "different companies are different reports"
);

// ── Reason validation ─────────────────────────────────────────────────────
for (const reason of Object.keys(REASONS)) {
  assert.ok(isValidReason(reason), `${reason} is an offered reason and must validate`);
}
for (const bad of ["", null, undefined, "nonsense", "constructor", "__proto__", "toString"]) {
  assert.strictEqual(isValidReason(bad), false, `"${bad}" must not validate as a reason`);
}

// ── Inbox notification ──────────────────────────────────────────────────
const previousReportTo = process.env.REPORT_TO_EMAIL;
delete process.env.REPORT_TO_EMAIL;
const message = buildListingReportEmail({
  company: "Example & Co\nBcc: attacker@example.com",
  role: "Summer <Analyst>",
  location: "New York, NY",
  url: "https://careers.example.com/jobs/123",
  reasons: ["dead-link"],
  notes: [{ note: "The page says <closed>." }],
  count: 1,
});
assert.strictEqual(DEFAULT_REPORT_TO_EMAIL, "help.promptly@gmail.com");
assert.strictEqual(message.to, "help.promptly@gmail.com", "reports must reach Promptly's support inbox by default");
assert.ok(message.subject.includes("Example & Co Bcc: attacker@example.com"), "subject newlines must be removed");
assert.ok(message.html.includes("Link is broken or 404s"), "email must show the human-readable report reason");
assert.ok(message.html.includes("Summer &lt;Analyst&gt;"), "listing details must be HTML escaped");
assert.ok(message.html.includes("New York, NY"), "email must include the listing's current location");
assert.ok(message.html.includes("https://careers.example.com/jobs/123"), "a safe listing URL must be linked");

const unsafeMessage = buildListingReportEmail({
  company: "Example",
  url: "javascript:alert(1)",
  reasons: ["other"],
  notes: [],
  count: 1,
});
assert.ok(!unsafeMessage.html.includes("javascript:"), "unsafe report URLs must never become email links");

if (previousReportTo === undefined) delete process.env.REPORT_TO_EMAIL;
else process.env.REPORT_TO_EMAIL = previousReportTo;

// ── API delivery ────────────────────────────────────────────────────────
// The serverless handler must wait for Resend. Returning first can cause the
// platform to freeze the process and silently discard the email.
async function testReportApiWaitsForEmail() {
  const reportsModule = require("../api/_shared/reports.js");
  const alertsModule = require("../api/_shared/alerts.js");
  const reportsPath = require.resolve("../api/_shared/reports.js");
  const alertsPath = require.resolve("../api/_shared/alerts.js");
  const subscribePath = require.resolve("../api/subscribe.js");
  const originalReports = require.cache[reportsPath].exports;
  const originalAlerts = require.cache[alertsPath].exports;
  let deliveryFinished = false;

  require.cache[reportsPath].exports = {
    ...originalReports,
    takeReportSlot: async () => ({ allowed: true }),
    recordReport: async (report) => ({
      ok: true,
      report: { ...report, reasons: [report.reason], notes: [], count: 1 },
    }),
  };
  require.cache[alertsPath].exports = {
    ...originalAlerts,
    sendListingReport: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      deliveryFinished = true;
      return { sent: true, id: "email_123" };
    },
  };
  delete require.cache[subscribePath];

  const handler = require(subscribePath);
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.10" },
    body: {
      action: "report",
      company: "Example",
      role: "Summer Analyst",
      url: "https://careers.example.com/jobs/123",
      reason: "dead-link",
      note: "Closed",
    },
  };
  const response = {
    statusCode: 0,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };

  try {
    await handler(req, response);
    assert.ok(deliveryFinished, "the API must wait for email delivery before returning");
    assert.strictEqual(response.statusCode, 200);
    assert.deepStrictEqual(response.body, { ok: true, emailSent: true });
  } finally {
    require.cache[reportsPath].exports = originalReports;
    require.cache[alertsPath].exports = originalAlerts;
    delete require.cache[subscribePath];
  }
}

testReportApiWaitsForEmail()
  .then(() => console.log("Listing report tests passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

// Listing-report identity and validation. No network, no Redis.
//
// The two things that must hold: repeat reports of the SAME listing aggregate
// into one reviewable row (otherwise one broken link from a popular company
// floods the queue), and a junk reason can't be stored.

const assert = require("node:assert/strict");
const { reportId, isValidReason, REASONS } = require("../api/_shared/reports.js");

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

console.log("Listing report tests passed.");

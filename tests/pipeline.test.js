// Ingestion pipeline: cycle detection, staleness, and deduplication.
//
// These encode the decisions from the 2026-08 backend audit. The biggest one:
// an internship with no year in its title is KEPT (live ATS feeds only carry
// current reqs) but labelled "Internship" rather than guessed into a season.
// Rejecting them was a 61% false-negative rate on student-relevant titles.

const assert = require("assert");
const { detectCycle, isPastCycle, canonicalUrl, normalizeCompany, normalizeRole } = require("../api/_shared/aggregator.js");

// ── Undated internships must survive, labelled honestly ───────────────────
assert.strictEqual(detectCycle("Quantitative Developer Intern", "New York"), "Internship");
assert.strictEqual(detectCycle("FPGA Intern", "Chicago"), "Internship");
assert.strictEqual(detectCycle("Technology Undergraduate Intern", "PA - Pittsburgh"), "Internship");

// ...but a stated term is never overwritten by the generic label.
assert.strictEqual(detectCycle("[Summer 2027] Software Engineer Intern", "San Mateo, CA"), "Summer 2027");
assert.strictEqual(detectCycle("Software Engineer Intern, Summer 2026", "Seattle"), "Summer 2026");
assert.strictEqual(detectCycle("Fall 2026 Data Science Intern", "Austin"), "Fall 2026");
assert.strictEqual(detectCycle("2027 Summer Analyst Program", "New York"), "Summer 2027");

// A student filtering for Summer 2027 must never be handed an unknown term.
assert.notStrictEqual(detectCycle("Software Engineer Intern", "Chicago"), "Summer 2027");

// ── Non-US and non-student roles stay out ─────────────────────────────────
for (const [title, location] of [
  ["Quantitative Research Intern", "London"],
  ["Campus ASIC Engineer (Intern)", "Bristol"],
  ["Data Science Intern", "Tel Aviv"],
  ["Engineering Intern", "Toronto, Ontario"],
  ["2027 Summer Internship Program", "Hong Kong"],
]) {
  assert.strictEqual(detectCycle(title, location), null, `${title} @ ${location} must be rejected as non-US`);
}
assert.strictEqual(detectCycle("Campus Recruiter, Technology", "New York"), null, "recruiting staff are not student roles");
assert.strictEqual(detectCycle("Senior Machine Learning Engineer - PhD Early Career", "San Mateo"), null, "senior roles are not student roles");

// ── Staleness ─────────────────────────────────────────────────────────────
const aug2026 = new Date("2026-08-11T00:00:00Z");
const sep2026 = new Date("2026-09-02T00:00:00Z");
assert.strictEqual(isPastCycle("Summer 2027", aug2026), false);
assert.strictEqual(isPastCycle("Summer 2025", aug2026), true);
assert.strictEqual(isPastCycle("Spring 2026", aug2026), true, "spring ends in May");
// A summer term runs through August, so it only goes stale afterwards.
assert.strictEqual(isPastCycle("Summer 2026", aug2026), false);
assert.strictEqual(isPastCycle("Summer 2026", sep2026), true);
// Undated terms can never be judged stale — we do not know when they run.
assert.strictEqual(isPastCycle("Internship", aug2026), false);
assert.strictEqual(isPastCycle("New Grad", aug2026), false);

// ── Deduplication identity ────────────────────────────────────────────────
// Tracking parameters must not make one posting look like several.
assert.strictEqual(
  canonicalUrl("https://boards.greenhouse.io/acme/jobs/9?gh_src=abc&utm_source=x#apply"),
  canonicalUrl("https://boards.greenhouse.io/acme/jobs/9")
);
assert.strictEqual(canonicalUrl("http://www.acme.com/careers/1/"), canonicalUrl("https://acme.com/careers/1"));

// Company suffixes and punctuation must not split one employer into several.
assert.strictEqual(normalizeCompany("Blue Origin, LLC"), normalizeCompany("Blue Origin"));
assert.strictEqual(normalizeCompany("Jane Street Capital"), normalizeCompany("Jane Street  Capital."));
assert.strictEqual(normalizeCompany("AT&T"), normalizeCompany("AT and T"));

// Titles differing only by decoration are the same role.
assert.strictEqual(
  normalizeRole("[Summer 2027] Software Engineer Intern (Remote)"),
  normalizeRole("Software Engineer Intern")
);
assert.strictEqual(normalizeRole("2027 Data Science Intern - US"), normalizeRole("Data Science Intern"));
// But genuinely different roles must stay distinct.
assert.notStrictEqual(normalizeRole("Software Engineer Intern"), normalizeRole("Hardware Engineer Intern"));

console.log("Pipeline tests passed.");

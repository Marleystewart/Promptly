// Ingestion pipeline: cycle detection, staleness, and deduplication.
//
// These encode the decisions from the 2026-08 backend audit. The biggest one:
// an internship with no year in its title is KEPT (live ATS feeds only carry
// current reqs) but labelled "Internship" rather than guessed into a season.
// Rejecting them was a 61% false-negative rate on student-relevant titles.

const assert = require("assert");
const { detectCycle, isPastCycle, canonicalUrl, normalizeCompany, normalizeRole, preferUsLocations } = require("../api/_shared/aggregator.js");

// ── Undated internships must survive, labelled honestly ───────────────────
assert.strictEqual(detectCycle("Quantitative Developer Intern", "New York"), "Internship");
assert.strictEqual(detectCycle("FPGA Intern", "Chicago"), "Internship");
assert.strictEqual(detectCycle("Technology Undergraduate Intern", "PA - Pittsburgh"), "Internship");

// ...but a stated term is never overwritten by the generic label.
assert.strictEqual(detectCycle("[Summer 2027] Software Engineer Intern", "San Mateo, CA"), "Summer 2027");
assert.strictEqual(detectCycle("Software Engineer Intern, Summer 2026", "Seattle"), "Summer 2026");
assert.strictEqual(detectCycle("Fall 2026 Data Science Intern", "Austin"), "Fall 2026");
assert.strictEqual(detectCycle("2027 Summer Analyst Program", "New York"), "Summer 2027");

// A single req can cover both US and international offices. Keep it when the
// feed explicitly includes a US location, but show only those US offices.
const mixedHrtLocations = "Austin, TX, United States; Chicago, Illinois, United States; London, United Kingdom; New York, NY, United States; Singapore";
assert.strictEqual(detectCycle("Software Engineering Internship – Summer 2027", mixedHrtLocations), "Summer 2027");
assert.strictEqual(
  preferUsLocations(mixedHrtLocations),
  "Austin, TX, United States; Chicago, Illinois, United States; New York, NY, United States"
);

// Two-letter codes are the sharp edge of US detection, in both directions.
// Found by auditing real feed output, not by review:
//   • "Amsterdam, NH" is Noord-Holland (Lucid Motors' board — the neighbouring
//     req at that location is a German-speaking role), not New Hampshire.
//   • lowercase "or" in "New York, London, or Paris" is not Oregon.
// But real US cities that share a name with a foreign one must still resolve.
for (const foreign of ["Amsterdam, NH", "Rotterdam, ZH", "New York, London, or Paris"]) {
  assert.strictEqual(detectCycle("Software Engineer Intern", foreign), null,
    `${foreign} must not be read as a US location`);
}
for (const domestic of ["Manchester, NH", "Bristol, PA", "Cambridge, MA", "Portland, OR"]) {
  assert.notStrictEqual(detectCycle("Software Engineer Intern", domestic), null,
    `${domestic} is a real US city and must survive`);
}

// A student filtering for Summer 2027 must never be handed an unknown term.
assert.notStrictEqual(detectCycle("Software Engineer Intern", "Chicago"), "Summer 2027");

// ── Campus-title gate ─────────────────────────────────────────────────────
// "Full Time Analyst" is the canonical campus-hire title in banking, but the
// same words describe an experienced hire. It needs independent evidence:
// either a students-only board, or an explicit future cycle year in the title.
// Without either, it stays out — emitting an experienced analyst role as a
// student job is the exact "wrong beats unknown" failure this repo forbids.
assert.strictEqual(detectCycle("Full Time Analyst - Strategic Advisory", "New York"), null,
  "an UNDATED campus title on a general board has no evidence and must stay out");
assert.strictEqual(detectCycle("Full Time Analyst - Strategic Advisory", "New York", true, true), "New Grad",
  "a students-only board is evidence enough without a year");
// The other gates still apply on a student board.
assert.strictEqual(detectCycle("Senior Full Time Analyst", "New York", true, true), null,
  "seniority filter must still apply on a student board");
assert.strictEqual(detectCycle("2026 Full Time Analyst (Hong Kong)", "Hong Kong", true, true), null,
  "international filter must still apply on a student board");

// An explicit FUTURE cycle year is independent evidence of a campus class, so
// the title counts even on a mixed board. Verified against William Blair's
// Greenhouse board, where campus roles are dated and experienced ones are not.
assert.strictEqual(detectCycle("2027 Investment Banking Full-Time Analyst", "Chicago, Illinois"), "New Grad 2027",
  "a DATED full-time analyst role is a campus class even on a mixed board");
assert.strictEqual(detectCycle("2027 Investment Banking Analyst I", "Boston, Massachusetts"), "New Grad 2027",
  "a future-dated entry analyst title is a campus role");
assert.strictEqual(detectCycle("Advisor Consultant Full-Time - Fall 2026", "Jersey City, United States", true, true), "New Grad 2026",
  "a full-time posting on a student-only board is an early-career role");
assert.strictEqual(detectCycle("Equities Associate Full Time Program 2027", "United States"), "New Grad 2027",
  "a DATED full-time campus program is a campus class even on a mixed board");
assert.strictEqual(detectCycle("Machine Learning Researcher PhD Graduate", "United States"), "New Grad",
  "an explicit PhD graduate title is a new-graduate role");
assert.strictEqual(detectCycle("Investment Banking Analyst, Private Capital Markets", "New York"), null,
  "an UNDATED analyst role on a mixed board stays out");
assert.strictEqual(detectCycle("Investment Banking Experienced Analyst - Tech", "Chicago"), null,
  "experienced roles stay out even when the board has campus roles");
assert.strictEqual(detectCycle("2025 Full-Time Analyst", "New York"), null,
  "a past-year campus class is still stale");
// MBA associate programs are a different audience than the undergrad product.
assert.strictEqual(detectCycle("2027 Investment Banking Full-Time MBA Associate", "Chicago"), null,
  "MBA associate programs are not undergrad campus roles");

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
assert.notStrictEqual(
  canonicalUrl("https://acme.com/careers/job/?gh_jid=101"),
  canonicalUrl("https://acme.com/careers/job/?gh_jid=202"),
  "gh_jid is a job identifier, not a tracking parameter"
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

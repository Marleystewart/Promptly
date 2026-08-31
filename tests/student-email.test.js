// A ".edu" badge is a claim about someone's institution, so a false positive
// is a trust problem, not a cosmetic one: it would tell a school that a
// personal-inbox user is one of their students.

const assert = require("node:assert/strict");
const { isStudentEmail, institutionDomain, studentStatus, domainOf } = require("../student-email");

// Real institutional addresses.
for (const email of [
  "marley@trinity.edu",
  "a.student@mail.harvard.edu",
  "s@berkeley.edu",
  "x@student.unimelb.edu.au",
  "y@ox.ac.uk",
  "z@nus.edu.sg",
  "MIXED.Case@Trinity.EDU",
]) {
  assert.equal(isStudentEmail(email), true, `${email} should count as academic`);
}

// Personal inboxes — the common case Promptly must still accept for signup,
// just without the badge.
for (const email of [
  "marley@gmail.com",
  "someone@googlemail.com",
  "a@outlook.com",
  "b@yahoo.com",
  "c@icloud.com",
  "d@proton.me",
]) {
  assert.equal(isStudentEmail(email), false, `${email} must not be badged as academic`);
}

// Lookalikes that must NOT pass — this is where a sloppy "contains .edu" check
// would wrongly badge someone.
for (const email of [
  "a@edu.com",            // .edu is the second level, not the suffix
  "b@notedu.org",
  "c@myedu.io",
  "d@edu",                // no dot at all
  "e@school.edu.evil.com", // academic label buried mid-domain
  "f@academy.com",
]) {
  assert.equal(isStudentEmail(email), false, `${email} must not pass as academic`);
}

// Malformed input must be false, never throw — this runs on every keystroke.
for (const bad of ["", null, undefined, "not-an-email", "@edu.edu", "a@", 42, {}]) {
  assert.equal(isStudentEmail(bad), false, `${JSON.stringify(bad)} must be rejected safely`);
}

// Institution is only ever reported for an academic address. Guessing a school
// from a personal inbox would be inventing data.
assert.equal(institutionDomain("marley@trinity.edu"), "trinity.edu");
assert.equal(institutionDomain("marley@gmail.com"), "", "no institution from a personal inbox");

// The status object is the single source the badge and the stored record share.
const student = studentStatus("s@mail.harvard.edu");
assert.deepEqual(student, { verified: true, source: "edu-domain", domain: "mail.harvard.edu" });
const personal = studentStatus("s@gmail.com");
assert.deepEqual(personal, { verified: false, source: null, domain: "" });

// Subaddressing and casing must not change the verdict.
assert.equal(isStudentEmail("A.B+intern@Trinity.edu"), true);
assert.equal(domainOf("A.B+intern@Trinity.edu"), "trinity.edu");

console.log("Student email tests passed. .edu is recognised; personal inboxes and lookalikes are not.");

// Taleo parses job data out of a serialised blob in the delivered HTML rather
// than from an API, so the parse is the whole adapter. A layout change on
// Oracle's side would silently return zero rows and look exactly like "this
// employer has no student roles" — which is why this pins the real shape.
//
// The fixture below is the genuine structure taken from the Federal Reserve
// Board's career section: the internal id and title repeat three times, then
// the requisition number, location, a flag, four empty fields, and the
// employer's own posting date.

const assert = require("node:assert/strict");
const { parsePage, decode, toIso } = require("../api/_shared/taleo");

const record = (id, title, req, loc, date) =>
  `${id}!|!${title}!|!${id}!|!${title}!|!${id}!|!${req}!|!${loc}!|!false!|!!|!!|!!|!!|!${date}!|!Apply!|!`;

const html = `<input type="hidden" name="initialHistory" id="initialHistory" value="ftlx0!|!listRequisition!|!rlPager!%24!false!|!false!|!` +
  record("30720", "Auditor (OIG)", "R025807", "DC-Washington", "Aug 28, 2026") +
  record("30801", "Summer Intern - Research %26 Statistics", "R025900", "DC-Washington", "Jan 16, 2026") +
  record("30802", "Dissertation Fellow", "R025901", "NY-New York", "not a date") +
  `" />`;

const rows = parsePage(html, "frbog", "1");

assert.equal(rows.length, 3, "every record in the blob must parse");

// Field mapping — a shifted offset would silently put the location in the date.
const [auditor, intern, fellow] = rows;
assert.equal(auditor.title, "Auditor (OIG)");
assert.equal(auditor.location, "DC-Washington");
assert.equal(auditor.url, "https://frbog.taleo.net/careersection/1/jobdetail.ftl?job=R025807");
assert.equal(auditor.postedAt.slice(0, 10), "2026-08-28", "the trailing field is the employer's post date");

// Taleo percent-escapes inside the attribute value; "%26" must become "&" or
// the title renders as mojibake in the app.
assert.equal(intern.title, "Summer Intern - Research & Statistics");
assert.equal(intern.postedAt.slice(0, 10), "2026-01-16");

// Unparseable dates degrade to null rather than guessing a month.
assert.equal(fellow.postedAt, null, "an unrecognised date must not be invented");
assert.equal(fellow.location, "NY-New York");

// Every URL must be https and carry the requisition, since these are the links
// students actually click.
assert.ok(rows.every((r) => /^https:\/\/frbog\.taleo\.net\//.test(r.url)));

// A page with no blob (Taleo changed the markup, or the section is empty) must
// return nothing rather than throwing into the aggregate refresh.
assert.deepEqual(parsePage("<html><body>no jobs here</body></html>", "frbog", "1"), []);
assert.deepEqual(parsePage("", "frbog", "1"), []);

// The record anchor relies on the id/title repetition. Loose text that merely
// contains digits and delimiters must not be mistaken for a job.
const noise = `<input id="initialHistory" value="ftlx0!|!rlPager!|!false!|!12!|!something!|!99!|!other!|!" />`;
assert.deepEqual(parsePage(noise, "frbog", "1"), [], "non-record text must not parse as a job");

// Helper behaviour.
assert.equal(decode("Research %26 Statistics"), "Research & Statistics");
assert.equal(decode("A &amp; B"), "A & B");
assert.equal(decode("bad %ZZ escape"), "bad %ZZ escape", "a malformed escape must not throw");
assert.equal(toIso(""), null);
assert.equal(toIso("Aug 28, 2026").slice(0, 10), "2026-08-28");
assert.equal(toIso("Jan 1, 1998"), null, "absurdly old dates are rejected");

console.log(`Taleo tests passed. ${rows.length} records parsed, field offsets pinned.`);

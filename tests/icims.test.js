// iCIMS career portals (api/_shared/icims.js). Card markup below is trimmed
// from real portals on 15 Sep 2026 — Peraton, Kimley-Horn and Dewberry each
// put the location somewhere different, and all three must parse.

const assert = require("node:assert/strict");
const { parseCards, parseLocation, usIcimsOnly, toIso, pageCount } = require("../api/_shared/icims.js");

const card = (inner) => `<li class="iCIMS_JobCardItem"> <div class="row"> ${inner} </div> </li>`;

// Peraton: location in the header-left block, labelled "Job Locations".
const peraton = card(`
  <div class="col-xs-6 header left"> <span class="sr-only field-label">Job Locations</span> <span > US-MD-Silver Spring | US-NJ-Basking Ridge</span> </div>
  <div class="col-xs-6 header right"> <span class="sr-only field-label">Requisition Post Information* : Posted Date</span> <span title="9/9/2026 9:55 AM"> 6 days ago</span> </div>
  <div class="col-xs-12 title"> <a href="https://careers-peraton.icims.com/jobs/170321/summer-2027-cyber-research-intern/job?in_iframe=1" class="iCIMS_Anchor" title="170321 - Summer 2027 Cyber Research Intern"> <span class="sr-only field-label">External Job Posting Title</span> <h3 > Summer 2027 Cyber Research Intern</h3> </a> </div>`);

// Kimley-Horn: same block, but the label reads "Location : Location".
const kimley = card(`
  <div class="col-xs-6 header left"> <span class="sr-only field-label">Location : Location</span> <span > US-FL-St. Petersburg</span> </div>
  <div class="col-xs-12 title"> <a href="https://careers-kimley-horn.icims.com/jobs/26562/mechanical-engineering-intern/job?hub=7&amp;in_iframe=1" class="iCIMS_Anchor"> <h3 > Mechanical Engineering Intern</h3> </a> </div>`);

// Dewberry: no header block at all; the location is a <dt>/<dd> pair.
const dewberry = card(`
  <div class="col-xs-12 title"> <a href="https://careers-dewberry.icims.com/jobs/16356/civil-engineering-intern/job?in_iframe=1" class="iCIMS_Anchor"> <h3 > Civil Engineering Intern</h3> </a> </div>
  <dl class="iCIMS_JobHeaderGroup"> <div class="iCIMS_JobHeaderTag"> <dt class="iCIMS_JobHeaderField">Position Level</dt> <dd class="iCIMS_JobHeaderData"><span > Internship</span> </dd> </div>
  <div class="iCIMS_JobHeaderTag"> <dt class="iCIMS_JobHeaderField"><span class="glyphicons glyphicons-map-marker"></span> <span class="sr-only field-label">Job Locations</span> </dt> <dd class="iCIMS_JobHeaderData"><span > US-FL-Orlando</span> </dd> </div> </dl>`);

// A Canadian office: must never be read as California.
const toronto = card(`
  <div class="col-xs-6 header left"> <span class="sr-only field-label">Job Locations</span> <span > CA-ON-Toronto</span> </div>
  <div class="col-xs-12 title"> <a href="https://x.icims.com/jobs/9/analyst-intern/job?in_iframe=1" class="iCIMS_Anchor"> <h3 > Analyst Intern</h3> </a> </div>`);

const rows = parseCards(`<ul>${peraton}${kimley}${dewberry}${toronto}</ul>`);
assert.equal(rows.length, 4);

const [p, k, d, t] = rows;
assert.equal(p.title, "Summer 2027 Cyber Research Intern");
assert.equal(p.url, "https://careers-peraton.icims.com/jobs/170321/summer-2027-cyber-research-intern/job", "in_iframe must be stripped from the link students click");
assert.equal(p.location, "Silver Spring, MD, United States; Basking Ridge, NJ, United States");
assert.equal(p.postedAt.slice(0, 10), "2026-09-09");
assert.equal(k.location, "St. Petersburg, FL, United States", "a different label must not lose the location");
assert.equal(k.url, "https://careers-kimley-horn.icims.com/jobs/26562/mechanical-engineering-intern/job?hub=7");
assert.equal(d.location, "Orlando, FL, United States", "the <dt>/<dd> location must be found");
assert.equal(d.postedAt, null);

// The trap: CA is Canada in the country position.
assert.equal(parseLocation("CA-ON-Toronto").us, false);
assert.equal(parseLocation("US-CA-Irvine").us, true);
assert.equal(parseLocation("US").us, true);
assert.deepEqual(usIcimsOnly(rows).map((r) => r.title), [
  "Summer 2027 Cyber Research Intern", "Mechanical Engineering Intern", "Civil Engineering Intern",
], "the Toronto card must be dropped");

// Plain-text locations fall back to the shared positive US test.
assert.deepEqual(usIcimsOnly([{ title: "a", location: "Boston, MA", us: null }, { title: "b", location: "London, UK", us: null }]).map((r) => r.title), ["a"]);

assert.equal(toIso("garbage"), null);
assert.equal(pageCount("<div>Page 1 of 3</div>"), 3);
assert.equal(pageCount("<div>no pager</div>"), 1);
assert.deepEqual(parseCards("<html>No jobs</html>"), []);

console.log("iCIMS tests passed. Three card layouts parse, and CA in the country slot is Canada.");

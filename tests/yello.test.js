// Yello job boards (api/_shared/yello.js) — Kearney. Row markup trimmed from
// the live board on 15 Sep 2026. "Americas" includes Canada and Latin America,
// so a row is US only with an exact US city from geo.js.
const assert = require("node:assert/strict");
const { parseRows, usYelloOnly } = require("../api/_shared/yello.js");

const row = (title, region, cities) => `<li class="search-results__item"><div class="clearfix"><div class="search-results__jobinfo pull-left"><a class="search-results__req_title" lang="en" href="/jobs/${title.length}?job_board_id=T">${title}</a><div><span>Full-time</span><span>${region}</span><span>${cities}</span></div></div></div></li>`;
const html = [
  row("Fall Foresight Intern ", "Americas", "Chicago"),
  row("Business Analyst", "Americas", "Toronto, Chicago"),
  row("Summer Analyst", "Americas", "Mexico City"),
  row("Summer Analyst", "Americas", "São Paulo"),
  row("Summer Business Analyst Intern 2027", "Europe", "Paris"),
  row("Kearney FP&amp;A Manager", "Americas", "Toronto"),
  // Birmingham and Manchester are also US cities in geo.js (AL, NH). Only the
  // region says these are the English offices, so the region check is load-bearing.
  row("Associate", "Europe", "Birmingham, Manchester"),
].join("");

const rows = parseRows(html, "kearney.recsolu.com");
assert.equal(rows.length, 7);
assert.equal(rows[0].title, "Fall Foresight Intern");
assert.equal(rows[0].location, "Chicago, IL, United States");
assert.equal(rows[0].url, "https://kearney.recsolu.com/jobs/22?job_board_id=T");
assert.deepEqual(rows.map((r) => r.us), [true, true, false, false, false, false, false],
  "US needs region Americas AND an exact US city; Mexico City, São Paulo, Toronto and Paris are not US");
assert.equal(rows[1].location, "Chicago, IL, United States", "only the US office is shown on a mixed row");
assert.equal(rows[5].title, "Kearney FP&A Manager", "entities are decoded");
assert.equal(usYelloOnly(rows).length, 2);
assert.ok(usYelloOnly(rows).every((r) => !("us" in r)));
assert.deepEqual(parseRows("", "x"), []);

console.log("Yello tests passed. Americas alone is not the US; an exact US city is.");

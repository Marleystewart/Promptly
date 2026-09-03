// SAP SuccessFactors (jobs2web) locations use an ISO COUNTRY CODE, and that
// shape defeats the generic US test badly enough to be worth its own predicate.
//
// "Noida, UP, IN, 201301" contains ", IN," and IN is Indiana. An unfiltered EY
// pull reported 286 "US" roles that were overwhelmingly Indian. ID is Indonesia
// and Idaho; AR is Argentina and Arkansas; DE is Germany and Delaware.

const assert = require("node:assert/strict");
const { countryOf, isUsJobs2Web, parseRows } = require("../api/_shared/jobs2web");

// The country is positional: the last segment once a trailing postcode is gone.
assert.equal(countryOf("Spring, TX, US, 77389"), "US");
assert.equal(countryOf("Noida, UP, IN, 201301"), "IN");
assert.equal(countryOf("Houston, TX, US"), "US");
assert.equal(countryOf(""), "");

// The exact pairs that made this necessary.
for (const location of [
  "Noida, UP, IN, 201301",          // Indiana
  "Bengaluru, KA, IN, 560001",      // Indiana
  "Jakarta, ID, 12190",             // Idaho
  "Buenos Aires, Capital Federal, AR, C10", // Arkansas
  "Berlin, BE, DE, 10115",          // Delaware
  "London, ENG, GB, EC2",
  "",
]) {
  assert.equal(isUsJobs2Web(location), false, `must not read as US: ${location}`);
}

for (const location of [
  "Spring, TX, US, 77389",
  "New York, NY, US, 10001-8604",
  "Washington, DC, US, 20006",
  "Houston, TX, US",
]) {
  assert.equal(isUsJobs2Web(location), true, `must read as US: ${location}`);
}

// The row parser must survive the real markup, including HTML entities in the
// title and the "+N more…" suffix on multi-site postings.
{
  const html = `
    <tr class="data-row">
      <td class="colTitle"><span class="jobTitle hidden-phone">
        <a href="/ey/job/Seattle-Tax-Advisor/1419926533/" class="jobTitle-link">Risk &amp; Internal Audit Consultant</a>
      </span></td>
      <td class="colLocation"><span class="jobLocation"> Seattle, WA, US, 98104 <small class="nobr">+6 more&hellip;</small> </span></td>
    </tr>`;
  const rows = parseRows(html, "https://careers.ey.com");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, "Risk & Internal Audit Consultant", "entities must be decoded");
  assert.equal(rows[0].url, "https://careers.ey.com/ey/job/Seattle-Tax-Advisor/1419926533/");
  assert.match(rows[0].location, /Seattle, WA, US, 98104/);
  assert.equal(isUsJobs2Web(rows[0].location), true, "a multi-site US posting still reads as US");
}

console.log("jobs2web tests passed. The country position decides, not a state-shaped code.");

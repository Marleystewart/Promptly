// Per-source filters added while working the 500-firm consulting list.
//
//   • positiveUsOnly on Greenhouse/Lever/Ashby — Secretariat's board lists one
//     internship per office and one "office" is literally "International".
//   • workdayFacets — TYLin and Marsh McLennan write locations with no country
//     ("US | IL | Chicago - …", "Honolulu - 201 Merchant"), so only the board's
//     own country facet can separate US reqs from foreign ones.
//   • recruiting events — S&P Global posts "Early Careers Networking Event" as a
//     req, and "early career" alone would have shown it as a New Grad job.
//
// No network: fetch is stubbed with the shapes each ATS really returns.

const assert = require("node:assert/strict");
const { fetchOne, detectCycle } = require("../api/_shared/aggregator.js");

const realFetch = global.fetch;
function stub(handler) {
  global.fetch = async (url, options = {}) => {
    const body = await handler(String(url), options);
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
  };
}

(async () => {
  try {
    // ── Greenhouse + positiveUsOnly ──────────────────────────────────────
    const ghJobs = {
      jobs: [
        { title: "Intern, Construction Delay", location: { name: "International" }, absolute_url: "https://job-boards.greenhouse.io/x/jobs/1" },
        { title: "Intern, Construction Delay", location: { name: "Atlanta, Georgia, United States" }, absolute_url: "https://job-boards.greenhouse.io/x/jobs/2" },
      ],
    };
    stub(() => ghJobs);
    const base = { company: "Test Firm", short: "T", field: "Consulting", ats: "greenhouse", board: "x" };

    const gated = await fetchOne({ ...base, positiveUsOnly: true });
    assert.deepEqual(gated.map((o) => o.location), ["Atlanta, Georgia, United States"],
      "positiveUsOnly must drop a req whose only location is the word \"International\"");

    const ungated = await fetchOne(base);
    assert.equal(ungated.length, 2, "without the flag Greenhouse behaves exactly as before");

    // Lever and Ashby honour the same flag.
    stub(() => [
      { text: "Research Intern", categories: { location: "International" }, hostedUrl: "https://jobs.lever.co/x/1" },
      { text: "Research Intern", categories: { location: "Boston, MA" }, hostedUrl: "https://jobs.lever.co/x/2" },
    ]);
    const lever = await fetchOne({ ...base, ats: "lever", positiveUsOnly: true });
    assert.deepEqual(lever.map((o) => o.location), ["Boston, MA"]);

    stub(() => ({ jobs: [
      { title: "Analyst Intern", location: "International", jobUrl: "https://jobs.ashbyhq.com/x/1" },
      { title: "Analyst Intern", location: "Chicago, IL", jobUrl: "https://jobs.ashbyhq.com/x/2" },
    ] }));
    const ashby = await fetchOne({ ...base, ats: "ashby", positiveUsOnly: true });
    assert.deepEqual(ashby.map((o) => o.location), ["Chicago, IL"]);

    // ── Workday + workdayFacets ──────────────────────────────────────────
    const US = "bc33aa3152ec42d4995f4791a106ed09";
    const sentFacets = [];
    stub((url, options) => {
      const body = JSON.parse(options.body);
      sentFacets.push(body.appliedFacets);
      if (body.searchText !== "intern" || body.offset) return { total: 0, jobPostings: [] };
      return { total: 1, jobPostings: [
        { title: "Aviation Planning Intern", externalPath: "/job/Chicago/Aviation-Planning-Intern_R1", locationsText: "US | IL | Chicago - 8755 West Higgins Road" },
      ] };
    });
    const wd = await fetchOne({ company: "TYLin", short: "TY", field: "Engineering", ats: "workday",
      tenant: "gi", dc: "wd1", site: "Global_Infrastructure", workdayFacets: { locationCountry: [US] } });
    assert.ok(sentFacets.length > 0);
    for (const facets of sentFacets) {
      assert.deepEqual(facets, { locationCountry: [US] }, "every Workday request must carry the source's facets");
    }
    assert.equal(wd.length, 1);

    sentFacets.length = 0;
    await fetchOne({ company: "Plain", short: "P", field: "Engineering", ats: "workday", tenant: "gi", dc: "wd1", site: "S" });
    for (const facets of sentFacets) assert.deepEqual(facets, {}, "a source without workdayFacets sends none");

    // ── Recruiting events are not jobs ───────────────────────────────────
    assert.equal(detectCycle("Exclusive S&P Global Ratings Early Careers Networking Event", "New York, NY"), null);
    assert.equal(detectCycle("Early Careers Information Session", "New York, NY"), null);
    assert.equal(detectCycle("Campus Webinar: Life as an Analyst", "Chicago, IL"), null);
    // …while real early-career reqs still pass.
    assert.equal(detectCycle("Early Career Analyst", "New York, NY"), "New Grad");
    assert.equal(detectCycle("Event Marketing Intern", "Austin, TX"), "Internship");

    // "Summer Consultant" is an internship title at consulting firms.
    assert.equal(detectCycle("Summer Consultant—2027", "Washington, DC"), "Summer 2027");
    assert.equal(detectCycle("Senior Consultant", "Washington, DC"), null, "a plain Consultant title is still not a student role");

    // ── A graduation year is not the term ────────────────────────────────
    // Real NERA and Huron titles on 15 Sep 2026.
    assert.equal(detectCycle("NERA Summer Internship (Summer 2028 Grads) (Multiple Locations)", "New York, NY"), "Internship",
      "a class year must not be read as the internship's term");
    assert.equal(detectCycle("Consulting Intern - Summer 2027, Chicago (Spring 2028 Graduates)", "Chicago, IL"), "Summer 2027");
    assert.equal(detectCycle("Analyst Intern (Spring 2028 Graduates) - Summer 2027", "Chicago, IL"), "Summer 2027",
      "the season must come from the term, not the graduation phrase");
    assert.equal(detectCycle("Turnaround and Restructuring Analyst 2027 Graduates (Q3/Q4 2027 Start Dates)", "Chicago, IL"), "New Grad 2027");

    console.log("Source filter tests passed. US gates, Workday facets, and event exclusion hold.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

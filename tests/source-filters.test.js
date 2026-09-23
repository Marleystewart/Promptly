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

    // A remote Ashby req writes only "Remote" as its location, but carries the
    // country in address.postalAddress. The Chartis Group's board is 40 reqs,
    // most of them exactly this shape — read on the text alone, a US employer's
    // whole board reads as un-placeable and disappears.
    stub(() => ({ jobs: [
      { title: "Analyst Intern", location: "Remote", jobUrl: "https://jobs.ashbyhq.com/x/3", address: { postalAddress: { addressCountry: "United States" } } },
      { title: "Analyst Intern", location: "Remote", jobUrl: "https://jobs.ashbyhq.com/x/4", address: { postalAddress: { addressCountry: "United Kingdom" } } },
      { title: "Analyst Intern", location: "Remote", jobUrl: "https://jobs.ashbyhq.com/x/5" },
    ] }));
    const remote = await fetchOne({ ...base, ats: "ashby", positiveUsOnly: true });
    assert.deepEqual(remote.map((o) => o.sourceUrl), ["https://jobs.ashbyhq.com/x/3"],
      "the US remote req is kept; a UK one and one with no country are not");

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

    // ── stateFirstLocations: "IL-Rosemont" is Rosemont, Illinois ─────────
    // PwC's entry-level Workday board writes the state first and names no
    // country, so every row read as un-placeable until it was flipped. The
    // flip is opt-in per source precisely because "CA-Toronto" is California
    // to this pattern and Canada to an ISO reader: only a two-letter US STATE
    // is flipped, and anything else is left exactly as the board wrote it.
    const { flipStateFirst } = require("../api/_shared/aggregator.js");
    assert.equal(flipStateFirst("IL-Rosemont"), "Rosemont, IL");
    assert.equal(flipStateFirst("NY-New York"), "New York, NY");
    assert.equal(flipStateFirst("TX-Dallas; FL-Tampa"), "Dallas, TX; Tampa, FL");
    const { isUsLocation } = require("../api/_shared/us-location.js");
    assert.equal(isUsLocation(flipStateFirst("IL-Rosemont")), true, "flipping is what lets the US test see the state");
    assert.equal(flipStateFirst("14 Locations"), "14 Locations", "a collapsed multi-office req is left alone");
    assert.equal(flipStateFirst("ZZ-Nowhere"), "ZZ-Nowhere", "a two-letter code that is not a US state is not a state");
    assert.equal(flipStateFirst("Amsterdam, NH"), "Amsterdam, NH", "only the state-first shape is touched");

    // ── US-only: the leaks a full run actually found ─────────────────────
    // Reading all 716 sources showed foreign student roles reaching US
    // students: Dentsu's DAN_GLOBAL board (Aarhus, København, Ho Chi Minh
    // City, Beirut), Caterpillar (Wuxi, Tianjin, Suzhou) and Balyasny
    // (Aalborg). Dentsu and Caterpillar are gated by their own Workday country
    // facet; these cities are also added to the blocklist so no future source
    // reintroduces them.
    //
    // The other half matters just as much: the blocklist is deliberately
    // permissive, and every one of these US towns MATCHES a foreign name in
    // it. They survive only because the guard is "blocked AND not positively
    // US". Rome NY, Melbourne FL, Vancouver WA and North Wales PA are the real
    // rows that a naive foreign-city check threw away.
    for (const loc of ["Aarhus", "København K", "Ho Chi Minh City", "Beirut", "Aalborg",
                       "Tianjin, Tianjin", "Wuxi, Jiangsu", "Suzhou, Jiangsu",
                       // Nubank writes its Mexican office in Spanish; the list
                       // only knew the English "Mexico City".
                       "Ciudad de México", "Ciudad de Mexico"]) {
      assert.equal(detectCycle("Summer Intern 2027", loc), null, `${loc} is not a US location`);
    }
    for (const loc of ["Rome, NY", "Melbourne, FL", "Vancouver, WA", "North Wales, PA",
                       "Pojoaque, New Mexico", "United States-Florida-Melbourne"]) {
      assert.ok(detectCycle("Summer Intern 2027", loc), `${loc} is a US town and must survive the blocklist`);
    }

    console.log("Source filter tests passed. US gates, Workday facets, and event exclusion hold.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

// Newer SuccessFactors Career Site Builder sites (api/_shared/sf-careers.js).
// Record shapes below are real, from Wipro, HCLTech and OPEN Health on
// 15 Sep 2026. Each tenant puts the country in a different field, and the
// adapter must read whichever is present without guessing from a state code.

const assert = require("node:assert/strict");
const { fetchSfCareersListings, usSfCareersOnly, countryOf, locationOf, postedAtOf, toListing } = require("../api/_shared/sf-careers.js");

const wipro = { jobLocationShort: ["Mountain View, USA-CA, USA, 94043<br/>"], jobLocationCountry: ["United States"], unifiedStandardTitle: "AI Developer (Entry Level)", urlTitle: "AI-Developer-%28Entry-Level%29", id: "159939", unifiedStandardStart: "4/10/26" };
const wiproRomania = { jobLocationShort: ["Timisoara, ROU-TIM, ROU, "], jobLocationCountry: ["Romania"], unifiedStandardTitle: "Account Payable Executive", urlTitle: "Account-Payable-Executive", id: "160272" };
const hcl = { custprimecity: "Houston", custCountryRegion: ["United States"], unifiedStandardTitle: "Early Career Associate", urlTitle: "Early-Career-Associate", id: "140943", unifiedStandardStart: "8/26/26" };
const hclOthers = { custprimecity: "Others", custCountryRegion: ["United States"], unifiedStandardTitle: "Solution Architect", urlTitle: "Solution-Architect", id: "1" };
const openHealthUs = { jobLocationShort: ["USA, "], sfstd_jobLocation_obj: ["Remote (US)"], unifiedStandardTitle: "Engagement Manager", unifiedUrlTitle: "Engagement-Manager", id: "995" };
const openHealthZa = { jobLocationShort: ["ZAF, "], unifiedStandardTitle: "Senior Medical Writer", urlTitle: "Senior-Medical-Writer", id: "920" };
const noCountry = { unifiedStandardTitle: "Mystery Intern", urlTitle: "Mystery-Intern", id: "7" };

// Country, from whichever field the tenant fills.
assert.equal(countryOf(wipro), "United States");
assert.equal(countryOf(hcl), "United States");
assert.equal(countryOf(openHealthUs), "United States", "the three-letter code in jobLocationShort counts");
assert.equal(countryOf(openHealthZa), "ZAF");
assert.equal(countryOf(noCountry), "");

// Display location.
assert.equal(locationOf(wipro), "Mountain View, CA, United States");
assert.equal(locationOf(hcl), "Houston, United States");
assert.equal(locationOf(hclOthers), "United States", "HCLTech's placeholder city \"Others\" is not a place");
assert.equal(locationOf(openHealthUs), "Remote (US), United States");

// Posted date: M/D/YY, and nothing invented on another shape.
assert.equal(postedAtOf(wipro).slice(0, 10), "2026-04-10");
assert.equal(postedAtOf({ unifiedStandardStart: "2026-04-10" }), null);

// URL, with the HTML entity some slugs carry.
assert.equal(toListing("https://careers.wipro.com", wipro).url, "https://careers.wipro.com/job/AI-Developer-%28Entry-Level%29/159939-en_US");
assert.equal(toListing("https://x.com", { ...openHealthUs, unifiedUrlTitle: "PM-&amp;-Senior-PM" }).url, "https://x.com/job/PM-%26-Senior-PM/995-en_US");
assert.equal(toListing("https://x.com", { id: "1" }), null, "no title, no listing");

// US filter: precision over recall — a record with no country is dropped.
const listings = [wipro, wiproRomania, hcl, openHealthUs, openHealthZa, noCountry].map((r) => toListing("https://x.com", r));
assert.deepEqual(usSfCareersOnly(listings).map((l) => l.title), ["AI Developer (Entry Level)", "Early Career Associate", "Engagement Manager"]);
assert.ok(usSfCareersOnly(listings).every((l) => !("us" in l)), "the internal flag must not leak into listings");

// End to end with a stub: facetFilters reach the route, paging stops on a short page.
const realFetch = global.fetch;
const bodies = [];
global.fetch = async (url, options) => {
  const body = JSON.parse(options.body);
  bodies.push(body);
  const page = body.keywords === "intern" && body.pageNumber === 0
    ? [{ response: wipro }, { response: wiproRomania }]
    : [];
  return { ok: true, json: async () => ({ totalJobs: page.length, jobSearchResult: page }) };
};

(async () => {
  try {
    const rows = await fetchSfCareersListings("https://careers.wipro.com", { facetFilters: { jobLocationCountry: ["United States"] } });
    assert.equal(rows.length, 2);
    assert.ok(bodies.length >= 1);
    for (const body of bodies) assert.deepEqual(body.facetFilters, { jobLocationCountry: ["United States"] });
    assert.equal(bodies.filter((b) => b.keywords === "intern").length, 1, "a short page must end the walk for that term");
    console.log("SuccessFactors Career Site Builder tests passed. Country read from the field each tenant fills.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

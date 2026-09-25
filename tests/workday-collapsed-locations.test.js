// Workday's "5 Locations" (api/_shared/aggregator.js, fetchWorkday).
//
// A multi-office req does not list its offices in the search results — Workday
// replaces them with a COUNT. That string names no city and no country, so a
// source marked positiveUsOnly had nothing to confirm and the req was thrown
// away. It was costing 46 real US student roles across 16 employers: all 14 of
// Nike's internships, 6 of CACI's, General Mills', Cencora's, Gartner's,
// Spencer Stuart's only one.
//
// The fix asks the board instead of guessing: the posting's own detail endpoint
// lists the primary office and every additional one. This test pins the three
// things that can silently break:
//
//   1. a collapsed US req survives, and shows its real offices
//   2. a collapsed FOREIGN req is still dropped
//   3. the expansion only happens for collapsed reqs, and only after the
//      student-role check — otherwise it is one extra request per requisition
//      on every board, every refresh

const assert = require("node:assert/strict");
const { fetchOne } = require("../api/_shared/aggregator.js");

const realFetch = global.fetch;
const detailCalls = [];

const src = {
  company: "Spencer Stuart", short: "SPST", logoClass: "cons",
  field: "Consulting", subField: "Management Consulting",
  ats: "workday", tenant: "spencerstuart", dc: "wd5",
  site: "Spencer_Stuart_External_Careers", positiveUsOnly: true,
};

const POSTINGS = [
  // Collapsed and US — five offices, none of them named in the search result.
  { title: "Summer Analyst Intern", locationsText: "5 Locations", externalPath: "/job/New-York/Summer-Analyst-Intern_R4909" },
  // Collapsed and foreign, with a city the blocklist knows: rejected on the
  // path city alone, before any request is spent on it.
  { title: "Graduate Analyst Programme", locationsText: "3 Locations", externalPath: "/job/Shanghai/Graduate-Analyst_R4865" },
  // Collapsed and foreign, with a city the blocklist does NOT know — Cyberjaya
  // is exactly the case positiveUsOnly exists for. This one survives to the
  // expansion and must be rejected on the offices that come back.
  { title: "Summer Intern Programme", locationsText: "2 Locations", externalPath: "/job/Cyberjaya/Summer-Intern_R4870" },
  // Not collapsed: a plain foreign office, dropped as before.
  { title: "Intern", locationsText: "Paris", externalPath: "/job/Paris/Intern_R4708" },
  // Not collapsed, US, and NOT a student role — must never be expanded.
  { title: "Associate General Counsel", locationsText: "New York, NY", externalPath: "/job/New-York/AGC_R4880" },
];

const DETAILS = {
  "/job/New-York/Summer-Analyst-Intern_R4909": {
    location: "New York",
    additionalLocations: ["Washington, D.C.", "Boston", "Philadelphia", "Chicago"],
  },
  "/job/Shanghai/Graduate-Analyst_R4865": {
    location: "Shanghai",
    additionalLocations: ["Hong Kong", "Singapore"],
  },
  "/job/Cyberjaya/Summer-Intern_R4870": {
    location: "Cyberjaya, Malaysia",
    additionalLocations: ["Kuala Lumpur, Malaysia"],
  },
};

global.fetch = async (url, options = {}) => {
  const u = String(url);
  if (u.endsWith("/jobs") && options.method === "POST") {
    const { offset } = JSON.parse(options.body);
    return {
      ok: true, status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ total: POSTINGS.length, jobPostings: offset === 0 ? POSTINGS : [] }),
    };
  }
  const path = u.slice(u.indexOf("/job/"));
  detailCalls.push(path);
  const info = DETAILS[path];
  if (!info) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => ({ jobPostingInfo: info }) };
};

(async () => {
  try {
    const rows = await fetchOne(src);
    const byRole = new Map(rows.map((r) => [r.role, r]));

    assert.deepEqual([...byRole.keys()].sort(), ["Summer Analyst Intern"],
      "only the collapsed US student req survives: both collapsed foreign ones, the Paris one and the non-student one must all be out");

    assert.equal(byRole.get("Summer Analyst Intern").location,
      "New York; Washington, D.C.; Boston; Philadelphia; Chicago",
      "the offices must come from the board's own detail payload, not from the URL");

    // The expansion is the expensive part, so it must be rationed: only a
    // collapsed req that already looks student-relevant may cost a request.
    // Shanghai is not in this list because the blocklist recognised its path
    // city and rejected it for free — which is the order we want. Cyberjaya is,
    // because nothing but its real offices could have told us.
    assert.deepEqual(detailCalls.sort(), [
      "/job/Cyberjaya/Summer-Intern_R4870",
      "/job/New-York/Summer-Analyst-Intern_R4909",
    ], "a req that is not collapsed, or not student-relevant, must never cost a detail request");

    // Exactly once each. The board returns the same req under several search
    // terms, so a verdict recorded only on success re-fetched every rejected
    // req once per term.
    assert.equal(detailCalls.length, new Set(detailCalls).size,
      "no req may be expanded twice, however many search terms return it");

    console.log("Workday collapsed-location tests passed. Real offices in, Shanghai out, no wasted requests.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

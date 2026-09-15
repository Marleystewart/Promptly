// Marsh McLennan's businesses share one Workday board, and the list reply does
// not say which business a req belongs to. api/_shared/mmc.js routes each req
// by the legal entity on its detail record. These pin the routing decisions
// that are easy to get wrong, using the shapes the board really returns.

const assert = require("node:assert/strict");
const { fetchMmcBrand, brandOf, cleanLocation, _resetCache } = require("../api/_shared/mmc.js");

// ── Routing by legal entity ─────────────────────────────────────────────────
assert.equal(brandOf("US063 Oliver Wyman, LLC"), "oliverwyman");
assert.equal(brandOf("US060 Oliver Wyman Actuarial Consulting, Inc."), "oliverwyman");
assert.equal(brandOf("US064 National Economic Research Associates, Inc."), "nera");
assert.equal(brandOf("US047 Mercer (US) LLC"), "mercer");
// The Agency's legal name contains "Marsh" — it must not be filed as Marsh.
assert.equal(brandOf("US012 Marsh & McLennan Agency LLC"), "mma");
assert.equal(brandOf("US031 Marsh & McLennan Shared Services LLC"), "marsh");
// The legal entity outranks the description's "Company:" line. Real case: a
// Mercer Health & Benefits req whose description opens "Company: Marsh".
assert.equal(brandOf("US048 Mercer Health & Benefits LLC", "Marsh"), "mercer");
// No entity on the record: fall back to the Company line.
assert.equal(brandOf(undefined, "Marsh McLennan Agency"), "mma");
assert.equal(brandOf(undefined, undefined), null);

assert.equal(cleanLocation("Chicago - 155 Wacker"), "Chicago");
assert.equal(cleanLocation("4 Locations"), "4 Locations");

// ── End to end, fetch stubbed ───────────────────────────────────────────────
const US = "bc33aa3152ec42d4995f4791a106ed09";
const LIST = [
  { title: "Oliver Wyman - Summer Analyst 2027 - Data and Analytics", externalPath: "/job/Raleigh/OW_R1", locationsText: "Raleigh - 1 Glenwood" },
  { title: "Insurance Intern (Summer 2027)", externalPath: "/job/Omaha/MMA_R2", locationsText: "2 Locations" },
  { title: "Health and Benefits Summer Intern - College Program 2027", externalPath: "/job/Chicago/Mercer_R3", locationsText: "Chicago - 155 Wacker" },
  { title: "NERA Summer Internship (Summer 2028 Grads)", externalPath: "/job/NYC/NERA_R4", locationsText: "6 Locations" },
  { title: "Lippincott - Design Intern", externalPath: "/job/NYC/LIPP_R5", locationsText: "New York - 499 Park" },
  { title: "Broken Detail Intern", externalPath: "/job/X/BROKEN_R6", locationsText: "Boston - 1 Main" },
  { title: "Senior Actuary", externalPath: "/job/X/SENIOR_R7", locationsText: "Boston - 1 Main" },
];
const ENTITY = {
  "/job/Raleigh/OW_R1": "US063 Oliver Wyman, LLC",
  "/job/Omaha/MMA_R2": "US012 Marsh & McLennan Agency LLC",
  "/job/Chicago/Mercer_R3": "US047 Mercer (US) LLC",
  "/job/NYC/NERA_R4": "US064 National Economic Research Associates, Inc.",
  "/job/NYC/LIPP_R5": "US063 Oliver Wyman, LLC",
};

const realFetch = global.fetch;
let listCalls = 0;
const detailCalls = [];
const facetsSent = [];
global.fetch = async (url, options = {}) => {
  const u = String(url);
  if (u.endsWith("/jobs")) {
    listCalls += 1;
    const body = JSON.parse(options.body);
    facetsSent.push(body.appliedFacets);
    const page = body.searchText === "intern" && body.offset === 0 ? LIST : [];
    return { ok: true, json: async () => ({ total: page.length, jobPostings: page }) };
  }
  const path = u.replace(/^.*\/MMC/, "");
  detailCalls.push(path);
  if (path.includes("BROKEN")) return { ok: false, status: 500, json: async () => ({}) };
  return { ok: true, json: async () => ({
    hiringOrganization: { name: ENTITY[path] },
    jobPostingInfo: { jobDescription: "<p>Company: Whatever</p>", startDate: "2026-09-01" },
  }) };
};

(async () => {
  try {
    _resetCache();
    const [ow, mercer, mma, nera, marsh] = await Promise.all(
      ["oliverwyman", "mercer", "mma", "nera", "marsh"].map(fetchMmcBrand),
    );

    assert.deepEqual(ow.map((r) => r.title).sort(), [
      "Lippincott - Design Intern",
      "Oliver Wyman - Summer Analyst 2027 - Data and Analytics",
    ]);
    assert.deepEqual(mercer.map((r) => r.location), ["Chicago"]);
    assert.equal(mma.length, 1);
    assert.equal(nera.length, 1);
    assert.equal(marsh.length, 0, "the Agency's intern must not appear under Marsh");
    assert.equal(ow[0].url.startsWith("https://mmc.wd1.myworkdayjobs.com/en-US/MMC/job/"), true);
    assert.equal(mercer[0].postedAt, "2026-09-01");

    // Five businesses asked at once, one shared read of the board.
    const listCallsPerTerm = listCalls;
    assert.ok(listCallsPerTerm <= 5, `expected one pass over the search terms, saw ${listCalls} list calls`);
    for (const facets of facetsSent) assert.deepEqual(facets, { Location_Country: [US] });
    // Detail is only fetched for student-shaped titles, and only once each.
    assert.ok(!detailCalls.some((p) => p.includes("SENIOR")), "a senior title must not cost a detail fetch");
    assert.equal(new Set(detailCalls).size, detailCalls.length);

    // A second call inside the TTL does not re-read the board.
    await fetchMmcBrand("mercer");
    assert.equal(listCalls, listCallsPerTerm);

    await assert.rejects(() => fetchMmcBrand("bogus"), /unknown Marsh McLennan business/);

    console.log("Marsh McLennan routing tests passed. Each req lands with the business that is hiring.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

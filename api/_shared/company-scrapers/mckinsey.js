const { isUsLocation } = require("../us-location");

// McKinsey & Company.
//
// Not on any of the standard systems. The careers page renders its job list
// with JavaScript, so scripts/discover-ats.js finds nothing in the markup —
// this endpoint was found by watching the rendered page's own network calls,
// the same technique that cracked Sixth Street and Mayo Clinic.
//
// The gateway answers a plain server fetch, which is what makes it usable.
// Two things about it are worth knowing before editing:
//
//   • Passing a search term returns HTTP 400 "No results found" rather than an
//     empty list, so filtering happens here rather than in the query.
//   • `start` is a PAGE NUMBER, not a row offset, and it is 1-based: start=0
//     and start=1 both return the first page, and start=200 returns HTTP 500.
//     Paging by offset the way every other adapter here does would fetch page
//     one twice and then crash.
//   • One posting carries an ARRAY of cities spanning several continents. A
//     single "Business Analyst Intern" is open in Atlanta, Athens and Abu
//     Dhabi at once. Emitting the whole list would put "Abu Dhabi" in front of
//     a student in Chicago, so each posting is reduced to its US cities and
//     dropped entirely when it has none.
const BASE = "https://gateway.mckinsey.com/apigw-x0cceuow60/v1/api/jobs/search";
const PAGE_SIZE = 200;
const MAX_PAGES = 6; // ~600 postings today, 3 pages; the cap stops a runaway loop

async function page(pageNumber) {
  const res = await fetch(`${BASE}?pageSize=${PAGE_SIZE}&start=${pageNumber}&lang=en`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} mckinsey jobs`);
  return res.json();
}

module.exports = async function fetchListings() {
  const out = [];

  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
    const data = await page(pageNumber);
    const docs = Array.isArray(data.docs) ? data.docs : [];
    if (!docs.length) break;

    for (const doc of docs) {
      const title = String(doc.title || "").trim();
      if (!title) continue;

      // Keep every city the posting actually names in the US. detectCycle in
      // the aggregator decides whether the ROLE is a student one; this only
      // decides whether it is reachable from where a student is.
      const cities = Array.isArray(doc.cities) ? doc.cities : [];
      const usCities = cities.filter((c) => isUsLocation(String(c)));
      if (!usCities.length) continue;

      // friendlyURL is the public posting page. jobApplyURL points into the
      // application system and can require a session, so it is the fallback.
      const url = doc.friendlyURL
        ? `https://www.mckinsey.com/careers/search-jobs/jobs/${doc.friendlyURL}`
        : doc.jobApplyURL;
      if (!url) continue;

      out.push({
        title,
        url,
        // One card per posting, not one per city: a role open in four US
        // offices is one job, and four identical cards would bury the feed.
        location: usCities.slice(0, 3).join("; "),
        postedAt: doc.postedToLinkedInDate || null,
      });
    }

    if (docs.length < PAGE_SIZE) break; // short page means this was the last
  }

  return out;
};

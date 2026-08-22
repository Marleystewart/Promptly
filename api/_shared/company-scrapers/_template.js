// ─────────────────────────────────────────────────────────────────────────
// TEMPLATE for a custom company scraper — copy this file, don't edit it.
//
// Use this ONLY when a company has no public feed on one of the 7 standard
// systems (Greenhouse/Lever/Workday/Ashby/SmartRecruiters/Flo Recruit/USAJOBS). Check
// those first; a custom scraper is the expensive, fragile fallback, not the
// default.
//
// Steps to add a new company:
//   1. Copy this file to company-scrapers/<yourcompany>.js
//   2. Write fetchListings() below to return an array of
//      { title, url, location } for every current internship/new-grad req.
//      Where that data comes from is up to you — a JSON endpoint the site
//      calls internally, or parsing the rendered page — whatever the
//      company's site actually gives you. No fake or guessed listings.
//   3. Add ONE line to api/_shared/sources.js:
//        { company: "Your Company", short: "YC", logoClass: "fin",
//          field: "Finance", ats: "custom", handler: "yourcompany" }
//      "handler" must match your filename (no .js).
//   4. Run `npm test` — tests/sources.test.js will fail loudly if the
//      handler file is missing or the source entry is malformed.
//   5. Run `node scripts/probe-candidates.js` (or just load the app
//      locally) to confirm it actually returns real listings before
//      committing.
//
// This runs on every hourly refresh cron, same as every other source. If the
// company redesigns their page, this WILL start returning [] or throwing —
// that's fine, aggregateOpenings() treats a failed source as "0 contributed"
// rather than crashing the whole pipeline. But nobody gets paged when that
// happens — you have to notice, e.g. via admin.html's per-source counts.
// ─────────────────────────────────────────────────────────────────────────

// detectCycle/normalize live in aggregator.js, which requires this file (not
// the other way around, to avoid a circular require). Just return PLAIN
// {title, url, location} objects — aggregator.js's fetchCustom() wrapper
// runs detectCycle + normalize() for you. Don't duplicate that logic here.

async function fetchListings(src) {
  // Example shape — replace with the real fetch/parse for this company.
  // const res = await fetch("https://example.com/careers/api/jobs", {
  //   signal: AbortSignal.timeout(12000),
  // });
  // const data = await res.json();
  // return data.jobs.map((j) => ({
  //   title: j.title,
  //   url: j.applyUrl,
  //   location: j.location,
  // }));

  return []; // placeholder — replace before wiring into sources.js
}

module.exports = fetchListings;

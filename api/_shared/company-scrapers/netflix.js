// Netflix runs its careers site on Eightfold (explore.jobs.netflix.net). The
// browser reads a public, unauthenticated Eightfold jobs API, so we call that
// feed directly. Eightfold's `query` param is a fuzzy relevance match, not a
// filter, so we run a few student-intent terms and let detectCycle() in
// aggregator.js apply the strict intern/new-grad + US gate — same division of
// labour as the Workday adapter.

const BASE = "https://explore.jobs.netflix.net";
const DOMAIN = "netflix.com";
const TERMS = ["intern", "internship", "new grad", "university graduate", "co-op"];
const PAGE_SIZE = 100;
const MAX_PAGES = 5; // per term

async function fetchPage(term, start) {
  const url = `${BASE}/api/apply/v2/jobs?domain=${DOMAIN}&start=${start}&num=${PAGE_SIZE}`
    + `&query=${encodeURIComponent(term)}&sort_by=relevance`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} netflix`);
  const data = await res.json();
  return {
    positions: Array.isArray(data.positions) ? data.positions : [],
    total: Number(data.count) || 0,
  };
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const start = page * PAGE_SIZE;
      let result;
      try {
        result = await fetchPage(term, start);
      } catch {
        break; // this term failed — keep the remaining terms
      }
      for (const p of result.positions) {
        const title = String(p.name || p.posting_name || "").replace(/\s+/g, " ").trim();
        const url = String(p.canonicalPositionUrl || "").trim();
        if (!title || !/^https:\/\//i.test(url)) continue;
        // locations is an array of "City,State,Country" strings; a single
        // location comes through the `location` field instead.
        const location = (Array.isArray(p.locations) && p.locations.length
          ? p.locations
          : [p.location].filter(Boolean)
        ).map((l) => String(l).replace(/\s+/g, " ").trim()).join("; ");
        seen.set(url, { title, url, location });
      }
      if (!result.positions.length || start + PAGE_SIZE >= result.total) break;
    }
  }
  return [...seen.values()];
}

module.exports = fetchListings;

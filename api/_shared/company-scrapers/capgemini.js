// Capgemini (Invent, Engineering and frog included) — the US job search on
// capgemini.com/us-en reads Capgemini's own job API, which answers a plain
// fetch. country_code=us-en scopes it to US reqs server-side (684 of ~5,000
// worldwide on 15 Sep 2026); the keyword parameter is ignored, so pages are
// walked and detectCycle does the filtering. Each row carries the official
// posting URL on careers.capgemini.com (SuccessFactors) as apply_job_url.
const API = "https://cg-jobstream-api.azurewebsites.net/api/job-search/";
const PAGE_SIZE = 100;
const MAX_PAGES = 10;

module.exports = async function fetchListings() {
  const seen = new Map();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await fetch(`${API}?country_code=us-en&page=${page}&size=${PAGE_SIZE}`, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (page === 1) throw new Error(`${res.status} capgemini`);
      break;
    }
    const data = await res.json();
    const rows = Array.isArray(data.data) ? data.data : [];
    for (const row of rows) {
      if (row.country_code !== "en-us") continue; // belt and braces: the filter is the US proof
      const url = String(row.apply_job_url || row.wp_url || "").replace(/[?&]utm_source=[^&]*/g, "");
      if (!row.title || !/^https:\/\//.test(url) || seen.has(url)) continue;
      seen.set(url, {
        title: String(row.title).replace(/\s+/g, " ").trim(),
        url,
        location: row.location ? `${row.location}, United States` : "United States",
        postedAt: row.updated_at || null,
      });
    }
    if (rows.length < PAGE_SIZE || page * PAGE_SIZE >= (Number(data.count) || 0)) break;
  }
  return [...seen.values()];
};

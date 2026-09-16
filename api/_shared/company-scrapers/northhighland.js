// North Highland — careers.northhighland.com, which runs on SourceFlow.
//
// Recorded as "job API requires a session token". It does not. The list comes
// from one POST to /_sf/api/v1/jobs/search.json, which answers a plain server
// request with no cookie, no token and no challenge — the earlier 401 was a GET
// against a POST-only route, not an authentication wall.
//
// `job_search` is required and must be non-empty; `query` and `offset` are the
// only two parameters it permits (limit, size, per_page, keyword and categories
// are all rejected by name), and it returns 10 results a page.
//
// Locations are structured: derived_info.locations[].postal_address gives
// region_code "US" plus state and city, so US-ness is exact and the card can
// show "Salem, OR" rather than the free-text "Salem, Oregon".

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const API = "https://careers.northhighland.com/_sf/api/v1/jobs/search.json";
const PAGE = 10;
const MAX_PAGES = 15;

function usPlaces(job) {
  const places = job.derived_info?.locations || [];
  return places
    .map((p) => p.postal_address || {})
    .filter((a) => String(a.region_code || "").toUpperCase() === "US")
    .map((a) => [a.locality, a.administrative_area].filter(Boolean).join(", "))
    .filter(Boolean);
}

async function page(offset) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": UA, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ job_search: { query: "", offset } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${res.status} north highland`);
  return res.json();
}

module.exports = async function fetchListings() {
  const seen = new Map();
  let total = 0;
  for (let offset = 0; offset < MAX_PAGES * PAGE; offset += PAGE) {
    let data;
    try {
      data = await page(offset);
    } catch (error) {
      // The first page failing is a real fault; a later one should not discard
      // what has already been read.
      if (!offset) throw error;
      break;
    }
    total = Number(data.total_size) || total;
    const results = Array.isArray(data.results) ? data.results : [];
    for (const { job } of results) {
      if (!job || !job.url_slug || !job.title) continue;
      const places = usPlaces(job);
      if (!places.length) continue; // North Highland also hires in the UK.
      seen.set(job.url_slug, {
        title: String(job.title).replace(/\s+/g, " ").trim(),
        url: `https://careers.northhighland.com/jobs/${encodeURIComponent(job.url_slug)}`,
        location: [...new Set(places)].join("; "),
        postedAt: job.published_at ? new Date(job.published_at * 1000).toISOString() : null,
      });
    }
    if (results.length < PAGE || offset + PAGE >= total) break;
  }
  return [...seen.values()];
};

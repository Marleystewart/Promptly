// Findly-hosted career sites (*.cdn.findly.com).
//
// The careers page is a large single-page app that 404s on every obvious search
// path, so this looked unreachable from the outside. It is not: the page calls
// a JSON API on m-cloud.io, and that API answers a plain Node fetch. The only
// way to find it was to watch the rendered page's own requests.
//
// Findly runs TWO different backends, and a tenant uses one or the other:
//
//   "internal" — jobsapi-internal.m-cloud.io/api/job
//                keyed by a numeric Organization id (Coca-Cola is 2110)
//                search parameter is SearchText, NOT Keyword/q/Search, all of
//                which are silently ignored and return the unfiltered list
//
//   "google"   — jobsapi-google.m-cloud.io/api/job/search
//                keyed by companyName=companies/<uuid>, Google Cloud Talent
//                Solution underneath, results wrapped in searchResults[].job
//
// Both expose primary_country, so US filtering is exact here — no state-code
// guessing, and none of the IN/Indiana ambiguity that jobs2web has.

const PAGE = 25;
const MAX = 200;

function normalize(job) {
  if (!job || !job.title) return null;
  const city = [job.primary_city, job.primary_state].filter(Boolean).join(", ");
  return {
    title: String(job.title),
    url: job.url || job.seo_url || job.fndly_url || "",
    location: [city, job.primary_country].filter(Boolean).join(", "),
    country: String(job.primary_country || "").toUpperCase(),
    postedAt: job.open_date || null,
  };
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} findly`);
  return res.json();
}

async function fetchInternal({ organization, portalId }, term, offset) {
  const url = new URL("https://jobsapi-internal.m-cloud.io/api/job");
  if (portalId) url.searchParams.append("facet[]", `ats_portalid:${portalId}`);
  url.searchParams.set("Organization", String(organization));
  url.searchParams.set("SearchText", term);
  url.searchParams.set("Limit", String(PAGE));
  url.searchParams.set("offset", String(offset + 1)); // this API is 1-based
  const data = await getJson(url);
  return (data.queryResult || []).map(normalize).filter(Boolean);
}

async function fetchGoogle({ companyUuid }, term, offset) {
  const url = new URL("https://jobsapi-google.m-cloud.io/api/job/search");
  url.searchParams.set("companyName", `companies/${companyUuid}`);
  url.searchParams.set("query", term);
  url.searchParams.set("pageSize", String(PAGE));
  url.searchParams.set("offset", String(offset));
  const data = await getJson(url);
  return (data.searchResults || []).map((r) => normalize(r.job || r)).filter(Boolean);
}

// `config` is { backend: "internal", organization, portalId }
//           or { backend: "google", companyUuid }
async function fetchFindlyListings(config, terms) {
  const fetchPage = config.backend === "google" ? fetchGoogle : fetchInternal;
  const seen = new Map();

  for (const term of terms) {
    for (let offset = 0; offset < MAX; offset += PAGE) {
      let rows;
      try {
        rows = await fetchPage(config, term, offset);
      } catch (error) {
        // First page failing is a real fault for source-health; a later page
        // failing should not discard what we already have.
        if (offset === 0) throw error;
        break;
      }
      for (const row of rows) {
        if (row.url && !seen.has(row.url)) seen.set(row.url, row);
      }
      if (rows.length < PAGE) break;
    }
  }

  return [...seen.values()];
}

// Findly reports the country directly, so this is an exact check rather than an
// inference from a state-shaped token.
function usFindlyOnly(records) {
  return (Array.isArray(records) ? records : [])
    .filter((r) => r.country === "US" || r.country === "USA");
}

module.exports = { fetchFindlyListings, usFindlyOnly, normalize };

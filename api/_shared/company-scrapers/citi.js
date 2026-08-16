// ─────────────────────────────────────────────────────────────────────────
// Citi is not on any of the 6 supported ATS platforms — it runs its own
// Phenom-style careers site at jobs.citi.com. Unlike McKinsey/Bain (checked
// and rejected — both run active Akamai/Cloudflare bot protection that
// blocks non-browser requests outright), Citi's search-results endpoint
// answers a plain server-side fetch with no auth, no cookies, and no bot
// challenge. It returns an HTML fragment (not clean JSON), so we parse it
// with cheerio rather than regex — regex-on-HTML breaks the moment the
// class ordering shifts even slightly.
// ─────────────────────────────────────────────────────────────────────────

const cheerio = require("cheerio");

const RESULTS_URL = "https://jobs.citi.com/search-jobs/results";
const RECORDS_PER_PAGE = 15;
const MAX_PAGES = 8; // safety cap per term, not expected to be hit
// Mirrors the same student-intent terms the Workday adapter uses — Citi's
// own search doesn't expose a "student roles only" facet, so detectCycle()
// (run by the aggregator.js wrapper that calls this file) does the real
// filtering afterwards.
const TERMS = ["intern", "campus", "graduate program"];

async function fetchPage(term, page) {
  const params = new URLSearchParams({
    ActiveFacetID: "0",
    CurrentPage: String(page),
    RecordsPerPage: String(RECORDS_PER_PAGE),
    Distance: "50",
    RadiusUnitType: "0",
    Keywords: term,
    Location: "",
    ShowRadius: "False",
    IsPagination: "False",
    SearchResultsModuleName: "Search Results",
    SearchFiltersModuleName: "Search Filters",
    SortCriteria: "5",
    SortDirection: "1",
    SearchType: "5",
    ResultsType: "0",
  });
  const res = await fetch(`${RESULTS_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} citi`);
  const data = await res.json();
  return String(data.results || "");
}

function parseItems(html) {
  const $ = cheerio.load(html);
  const out = [];
  $(".sr-job-item").each((_, el) => {
    const link = $(el).find(".sr-job-item__link").first();
    const href = link.attr("href");
    const title = link.text().replace(/\s+/g, " ").trim();
    const location = $(el).find(".sr-job-location").first().text().replace(/\s+/g, " ").trim();
    if (href && title) out.push({ title, url: `https://jobs.citi.com${href}`, location });
  });
  return out;
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      let html;
      try {
        html = await fetchPage(term, page);
      } catch {
        break; // this term failed — move to the next rather than abandon the source
      }
      const items = parseItems(html);
      if (!items.length) break;
      for (const item of items) seen.set(item.url, item);
      if (items.length < RECORDS_PER_PAGE) break;
    }
  }
  return [...seen.values()];
}

module.exports = fetchListings;

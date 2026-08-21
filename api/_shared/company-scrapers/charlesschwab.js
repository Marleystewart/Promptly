// Charles Schwab's TalentBrew search UI exposes the same live result fragment
// it renders in the browser as unauthenticated JSON containing server HTML.

const cheerio = require("cheerio");

const ORIGIN = "https://www.schwabjobs.com";
const RESULTS_URL = `${ORIGIN}/en/search-jobs/results`;
const TERMS = ["intern", "internship", "summer 2027", "new graduate", "rotational program"];
const PAGE_SIZE = 15;
const MAX_PAGES = 8;

async function fetchPage(term, page) {
  const params = new URLSearchParams({
    ActiveFacetID: "0", CurrentPage: String(page), RecordsPerPage: String(PAGE_SIZE),
    Distance: "50", RadiusUnitType: "0", Keywords: term, Location: "",
    ShowRadius: "False", IsPagination: "False", SearchResultsModuleName: "Search Results",
    SearchFiltersModuleName: "Search Filters", SortCriteria: "0", SortDirection: "0",
    SearchType: "5", ResultsType: "0",
  });
  const res = await fetch(`${RESULTS_URL}?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", "X-Requested-With": "XMLHttpRequest" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} charlesschwab`);
  const data = await res.json();
  return String(data.results || "");
}

function parsePage(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $("#search-results-list li").each((_, item) => {
    const link = $(item).find('a[href*="/job/"]').first();
    const href = link.attr("href");
    const title = link.find("h2").text().replace(/\s+/g, " ").trim();
    const location = link.find(".job-location").text().replace(/\s+/g, " ").trim();
    if (href && title) jobs.push({ title, url: new URL(href, ORIGIN).href, location });
  });
  return { jobs, pages: Number($("#search-results").attr("data-total-pages")) || 1 };
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      let parsed;
      try {
        parsed = parsePage(await fetchPage(term, page));
      } catch {
        break;
      }
      for (const job of parsed.jobs) seen.set(job.url, job);
      if (!parsed.jobs.length || page >= parsed.pages) break;
    }
  }
  return [...seen.values()];
}

module.exports = fetchListings;

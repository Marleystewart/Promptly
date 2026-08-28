// American Express uses Oracle Recruiting Cloud behind its branded careers
// domain. The browser reads this unauthenticated Oracle feed; using it keeps
// links tied to live requisitions without parsing the client-rendered page.

const API_URL = "https://egug.fa.us2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions";
const JOB_URL = "https://careers.americanexpress.com/en/sites/CX_1/job";
const SITE_NUMBER = "CX_1";
const PAGE_SIZE = 100;
const MAX_PAGES = 8;

function searchTerms() {
  const year = new Date().getUTCFullYear();
  return [String(year), String(year + 1), String(year + 2), "internship", "campus"];
}

async function fetchPage(term, offset) {
  const params = new URLSearchParams({
    onlyData: "true",
    expand: "requisitionList",
    finder: `findReqs;siteNumber=${SITE_NUMBER},keyword=${term},limit=${PAGE_SIZE},offset=${offset}`,
  });
  const res = await fetch(`${API_URL}?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} americanexpress`);
  const data = await res.json();
  const result = Array.isArray(data.items) ? data.items[0] : null;
  return {
    jobs: Array.isArray(result?.requisitionList) ? result.requisitionList : [],
    total: Number(result?.TotalJobsCount) || 0,
  };
}

async function fetchListings() {
  const seen = new Map();
  for (const term of searchTerms()) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const offset = page * PAGE_SIZE;
      let result;
      try {
        result = await fetchPage(term, offset);
      } catch {
        break;
      }
      for (const job of result.jobs) {
        const id = String(job.Id || "").trim();
        const title = String(job.Title || "").replace(/\s+/g, " ").trim();
        if (!id || !title) continue;
        const url = `${JOB_URL}/${encodeURIComponent(id)}`;
        seen.set(url, {
          title,
          url,
          location: String(job.PrimaryLocation || "").replace(/\s+/g, " ").trim(),
          postedAt: job.PostedDate || null, // Oracle's real post date
        });
      }
      if (!result.jobs.length || offset + PAGE_SIZE >= result.total) break;
    }
  }
  return [...seen.values()];
}

module.exports = fetchListings;

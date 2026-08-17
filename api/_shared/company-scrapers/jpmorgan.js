// JPMorgan's public careers board is Oracle Recruiting Cloud. The browser UI
// reads this unauthenticated JSON endpoint, so use the feed directly instead
// of parsing Oracle's client-rendered markup.

const API_URL = "https://jpmc.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions";
const JOB_URL = "https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/job";
const SITE_NUMBER = "CX_1001";
const PAGE_SIZE = 100;
const MAX_PAGES = 8; // safety cap per term

function searchTerms() {
  const year = new Date().getUTCFullYear();
  // Year searches pick up both internships and full-time analyst programs;
  // "internship" catches current postings whose titles omit a cycle year.
  return [String(year), String(year + 1), String(year + 2), "internship"];
}

async function fetchPage(term, offset) {
  const params = new URLSearchParams({
    onlyData: "true",
    expand: "requisitionList",
    finder: `findReqs;siteNumber=${SITE_NUMBER},keyword=${term},limit=${PAGE_SIZE},offset=${offset}`,
  });
  const res = await fetch(`${API_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} jpmorgan`);

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
        break; // this term failed — continue with the remaining searches
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
        });
      }

      if (!result.jobs.length || offset + PAGE_SIZE >= result.total) break;
    }
  }

  return [...seen.values()];
}

module.exports = fetchListings;

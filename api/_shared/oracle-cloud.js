// Reusable Oracle Recruiting Cloud (Candidate Experience) adapter.
//
// Oracle's candidate UI reads this unauthenticated JSON endpoint directly, so
// we use the feed rather than parsing its client-rendered markup. Several
// employers here run it (JPMorgan, BNY, Lazard, Cantor, Chubb) with only the
// host and siteNumber differing.
//
// PostedDate is Oracle's own posting date, which is what puts a role in the
// month it actually dropped rather than the month Promptly first saw it.

const PAGE_SIZE = 100;
const MAX_PAGES = 8; // safety cap per search term

function defaultTerms() {
  const year = new Date().getUTCFullYear();
  return [String(year), String(year + 1), String(year + 2), "internship"];
}

async function fetchPage(host, siteNumber, term, offset) {
  const params = new URLSearchParams({
    onlyData: "true",
    expand: "requisitionList",
    finder: `findReqs;siteNumber=${siteNumber},keyword=${term},limit=${PAGE_SIZE},offset=${offset}`,
  });
  const url = `https://${host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${res.status} oracle ${host}`);
  const data = await res.json();
  const result = Array.isArray(data.items) ? data.items[0] : null;
  return {
    jobs: Array.isArray(result?.requisitionList) ? result.requisitionList : [],
    total: Number(result?.TotalJobsCount) || 0,
  };
}

async function fetchOracleListings(host, siteNumber, terms = defaultTerms()) {
  const seen = new Map();
  const jobBase = `https://${host}/hcmUI/CandidateExperience/en/sites/${siteNumber}/job`;

  for (const term of terms) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const offset = page * PAGE_SIZE;
      let result;
      try {
        result = await fetchPage(host, siteNumber, term, offset);
      } catch {
        break; // this term failed — continue with the remaining searches
      }
      for (const job of result.jobs) {
        const id = String(job.Id || "").trim();
        const title = String(job.Title || "").replace(/\s+/g, " ").trim();
        if (!id || !title) continue;
        const url = `${jobBase}/${encodeURIComponent(id)}`;
        if (seen.has(url)) continue;
        seen.set(url, {
          title,
          url,
          location: String(job.PrimaryLocation || "").replace(/\s+/g, " ").trim(),
          postedAt: job.PostedDate || null,
        });
      }
      if (!result.jobs.length || offset + PAGE_SIZE >= result.total) break;
    }
  }
  return [...seen.values()];
}

module.exports = { fetchOracleListings };

// Stifel's careers UI is powered by Jibe and exposes its live job inventory
// through an unauthenticated JSON endpoint used by the browser.

const API_URL = "https://join.stifel.com/api/jobs";
const JOB_URL = "https://join.stifel.com/jobs";
const TERMS = ["intern", "internship", "summer analyst", "graduate program"];

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    const url = new URL(API_URL);
    url.searchParams.set("keywords", term);
    let data;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`${res.status} stifel`);
      data = await res.json();
    } catch {
      continue;
    }

    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    for (const record of jobs) {
      const job = record?.data || {};
      const slug = String(job.slug || job.req_id || "").trim();
      const title = String(job.title || "").replace(/\s+/g, " ").trim();
      if (!slug || !title || job.searchable === false) continue;
      const location = [job.city, job.state, job.country].filter(Boolean).join(", ");
      const posting = { title, url: `${JOB_URL}/${encodeURIComponent(slug)}`, location };
      seen.set(posting.url, posting);
    }
  }
  return [...seen.values()];
}

module.exports = fetchListings;

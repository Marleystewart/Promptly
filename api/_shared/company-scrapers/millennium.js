// Millennium's student careers site is powered by Eightfold. Its public
// search endpoint returns the same current positions shown in the browser.

const API = "https://campusjobs.mlp.com/api/apply/v2/jobs";
const PAGE_SIZE = 10;

async function fetchListings() {
  const jobs = [];

  for (let start = 0; start < 500; start += PAGE_SIZE) {
    const url = new URL(API);
    url.searchParams.set("domain", "mlp.com");
    url.searchParams.set("microsite", "campus-site");
    url.searchParams.set("start", String(start));
    url.searchParams.set("num", String(PAGE_SIZE));
    url.searchParams.set("query", "*");

    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`${res.status} millennium`);
    const data = await res.json();
    const positions = Array.isArray(data.positions) ? data.positions : [];

    for (const job of positions) {
      jobs.push({
        title: job.name,
        url: job.canonicalPositionUrl || `https://mlp.eightfold.ai/careers/job/${job.id}`,
        location: job.location || "",
      });
    }

    if (!positions.length || start + positions.length >= Number(data.count || 0)) break;
  }

  return jobs.filter((job) => job.title && job.url);
}

module.exports = fetchListings;

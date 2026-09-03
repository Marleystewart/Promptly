// Eightfold-hosted career sites.
//
// Eightfold serves two different APIs and only one of them is usable here:
//
//   /api/apply/v2/jobs  — what Millennium's custom microsite exposes. On a
//                         branded tenant (careers.qualcomm.com) it answers 403.
//   /api/pcsx/search    — what the branded careers page itself calls. Open, no
//                         token, and works from a plain Node fetch.
//
// That distinction cost an hour: the 403 looks like bot protection and reads as
// "this employer cannot be scraped", when in fact the wrong endpoint was being
// asked. Millennium keeps its own scraper because its microsite genuinely uses
// the other API.
//
// Results are NOT US-filtered here — callers pipe through usOnly(). Eightfold
// tenants are typically global (Qualcomm's first page is Colombia, Ireland and
// Brazil), so that filtering is the caller's decision, not a hidden default.

const PAGE = 10; // the API ignores `num` and returns 10 regardless
const MAX = 100; // 10 pages per term is plenty for student roles

async function fetchEightfoldListings(origin, domain, terms) {
  const seen = new Map();

  for (const term of terms) {
    for (let start = 0; start < MAX; start += PAGE) {
      let data;
      try {
        const url = new URL("/api/pcsx/search", origin);
        url.searchParams.set("domain", domain);
        url.searchParams.set("query", term);
        url.searchParams.set("location", "");
        url.searchParams.set("start", String(start));
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
          },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} eightfold ${domain}`);
        data = await res.json();
      } catch (error) {
        // First page failing is a real fault worth surfacing to source-health.
        // A later page failing mid-walk should not discard what we already have.
        if (start === 0) throw error;
        break;
      }

      const positions = (data && data.data && data.data.positions) || [];
      for (const job of positions) {
        if (!job || !job.name) continue;
        const id = String(job.id || job.displayJobId || job.name);
        if (seen.has(id)) continue;
        seen.set(id, {
          title: job.name,
          url: job.positionUrl || `${origin}/careers/job/${job.id}`,
          // Eightfold returns an array; the first entry is the primary office.
          location: Array.isArray(job.locations) ? job.locations.join("; ") : (job.locations || ""),
          // postedTs and creationTs are epoch milliseconds.
          postedAt: job.postedTs ? new Date(Number(job.postedTs)).toISOString() : null,
        });
      }

      const total = Number((data && data.data && data.data.count) || 0);
      if (!positions.length || start + positions.length >= total) break;
    }
  }

  return [...seen.values()];
}

module.exports = { fetchEightfoldListings };

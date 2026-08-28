// Jibe career sites (careers.<company>.com, front-end for iCIMS/Workday behind
// the scenes) expose a clean JSON search API at <origin>/api/jobs. The page
// itself is client-rendered, but this endpoint returns the full job list with
// title, full location, and the real apply URL. Reusable across any Jibe site.

async function fetchJibeListings(origin, terms) {
  const seen = new Map();
  for (const term of terms) {
    for (let page = 1; page <= 5; page += 1) {
      let jobs;
      try {
        const url = `${origin}/api/jobs?keywords=${encodeURIComponent(term)}&limit=100&page=${page}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} jibe`);
        const data = await res.json();
        jobs = Array.isArray(data.jobs) ? data.jobs : [];
      } catch {
        break;
      }
      if (!jobs.length) break;
      for (const raw of jobs) {
        const job = raw.data || raw;
        const title = String(job.title || "").replace(/\s+/g, " ").trim();
        const url = String(job.apply_url || job.canonical_url || job.url || "").trim();
        if (!title || !/^https:\/\//i.test(url)) continue;
        const location = String(job.full_location || [job.city, job.state, job.country].filter(Boolean).join(", ") || "")
          .replace(/\s+/g, " ").trim();
        seen.set(url, { title, url, location });
      }
      if (jobs.length < 100) break;
    }
  }
  return [...seen.values()];
}

module.exports = { fetchJibeListings };

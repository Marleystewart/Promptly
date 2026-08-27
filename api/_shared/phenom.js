// Phenom career sites server-render the first page of their own search result
// data into phApp.ddo. Reading that payload avoids browser automation and
// yields the employer's original apply URL, title, and structured location.

function extractJsonObject(html, marker) {
  const markerIndex = html.indexOf(marker);
  const start = html.indexOf("{", markerIndex);
  if (markerIndex < 0 || start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return html.slice(start, index + 1);
  }
  return null;
}

async function fetchPhenomListings(origin, terms) {
  const seen = new Map();
  for (const term of terms) {
    for (let from = 0; from < 100; from += 10) {
      const url = new URL("/us/en/search-results", origin);
      url.searchParams.set("keywords", term);
      if (from) url.searchParams.set("from", String(from));
      let search;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} phenom`);
        const raw = extractJsonObject(await res.text(), "phApp.ddo =");
        const ddo = raw ? JSON.parse(raw) : null;
        search = ddo?.eagerLoadRefineSearch;
      } catch {
        break;
      }
      const jobs = Array.isArray(search?.data?.jobs) ? search.data.jobs : [];
      for (const job of jobs) {
        const title = String(job.title || "").replace(/\s+/g, " ").trim();
        const applyUrl = String(job.applyUrl || job.imApplyUrl || "").trim();
        const location = String(job.cityStateCountry || job.cityState || job.location || "")
          .replace(/\s+/g, " ").trim();
        // Phenom exposes the employer's real post date — carry it so roles land
        // in the month they actually dropped, not when Promptly first saw them.
        const postedAt = job.postedDate || job.dateCreated || null;
        if (title && /^https:\/\//i.test(applyUrl)) seen.set(applyUrl, { title, url: applyUrl, location, postedAt });
      }
      const total = Number(search?.totalHits) || jobs.length;
      if (!jobs.length || from + jobs.length >= total) break;
    }
  }
  return [...seen.values()];
}

// Some Phenom sites (Roche, Warner Bros…) don't server-render the search data
// into phApp.ddo; they load it from a POST to <origin>/widgets with
// ddoKey:"refineSearch". This reads that feed instead. Same return shape as
// fetchPhenomListings: plain { title, url, location } objects for aggregator.js.
async function fetchPhenomWidgets(origin, terms) {
  const seen = new Map();
  for (const term of terms) {
    for (let from = 0; from < 100; from += 10) {
      let jobs;
      try {
        const res = await fetch(`${origin}/widgets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: origin,
            Referer: `${origin}/us/en/search-results`,
            "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
          },
          body: JSON.stringify({
            lang: "en_us", deviceType: "desktop", country: "us",
            ddoKey: "refineSearch", sortBy: "Most Recent", subsearch: "",
            from, jobs: true, counts: true, all_fields: [], size: 10,
            clearAll: false, jdsource: "facets", isSliderEnable: false,
            pageName: "search-results", siteType: "external",
            keywords: term, global: true, selected_fields: {}, locationData: {},
          }),
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} phenom-widgets`);
        const data = await res.json();
        jobs = Array.isArray(data?.refineSearch?.data?.jobs) ? data.refineSearch.data.jobs : [];
      } catch {
        break;
      }
      for (const job of jobs) {
        const title = String(job.title || "").replace(/\s+/g, " ").trim();
        const applyUrl = String(job.applyUrl || job.imApplyUrl || "").trim();
        const location = String(job.cityStateCountry || job.cityState || job.location || "")
          .replace(/\s+/g, " ").trim();
        // Same fields as the phApp.ddo path above — the /widgets response uses
        // the identical shape, so employers on this path (Mastercard, Roche,
        // Fiserv, FIS) get real post dates too rather than silently none.
        const postedAt = job.postedDate || job.dateCreated || null;
        if (title && /^https:\/\//i.test(applyUrl)) seen.set(applyUrl, { title, url: applyUrl, location, postedAt });
      }
      if (!jobs.length) break;
    }
  }
  return [...seen.values()];
}

module.exports = { fetchPhenomListings, fetchPhenomWidgets };

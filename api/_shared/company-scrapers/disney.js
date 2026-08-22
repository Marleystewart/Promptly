// The Walt Disney Company runs its careers site on Radancy (formerly TMP),
// jobs.disneycareers.com/search-jobs. There's no JSON ATS feed, but the search
// results are server-rendered HTML: each row carries the posting link, title,
// and a full "City, State, Country" location — enough for aggregator.js to keep
// US roles and drop international ones. We parse that HTML directly.
//
// Radancy's `keyword` path (/search-jobs/<term>) is a loose match, so we run a
// few student-intent terms and let detectCycle() apply the strict gate.

const BASE = "https://jobs.disneycareers.com";
const TERMS = ["intern", "internship", "graduate"];
const MAX_PAGES = 6; // Radancy paginates with ?p=N, ~15 rows/page

// One results row: <a href="/job/.."><h2>Title</h2></a> ... job-location">Loc<
const ROW = /href="(\/job\/[^"]+)"[^>]*>\s*<h2>([^<]+)<\/h2>[\s\S]{0,600}?class="job-location">([^<]+)</gi;

function decode(s) {
  return String(s)
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ").trim();
}

async function fetchTermPage(term, page) {
  const url = `${BASE}/search-jobs/${encodeURIComponent(term)}${page > 1 ? `?p=${page}` : ""}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} disney`);
  return res.text();
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      let html;
      try {
        html = await fetchTermPage(term, page);
      } catch {
        break;
      }
      let count = 0;
      for (const m of html.matchAll(ROW)) {
        count += 1;
        const url = BASE + m[1];
        const title = decode(m[2]);
        // "Glendale, California, United States / New York, ..." — keep as-is;
        // aggregator.js splits on "/" is not needed, it reads the whole string.
        const location = decode(m[3]).replace(/\s*,\s*/g, ", ");
        if (title) seen.set(url, { title, url, location });
      }
      if (!count) break; // no more rows for this term
    }
  }
  return [...seen.values()];
}

module.exports = fetchListings;

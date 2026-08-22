// Radancy (formerly TMP Worldwide) career sites — jobs.<company>.com/search-jobs
// — server-render their results as HTML. Each row carries the posting link, an
// <h2> title, and a "job-location" element with a full "City, State, Country"
// string, which is exactly what aggregator.js needs to keep US roles and drop
// international ones. Several big employers run identical Radancy sites (Disney,
// Sanofi, Sony Pictures, UnitedHealth…), so the parse lives here once.
//
// Radancy's keyword path (/search-jobs/<term>) is a loose match, so callers
// pass a few student-intent terms and let detectCycle() apply the strict gate.

// A results row: <a href="[/xx]/job/..."> … <h2>Title</h2> … job-location">Loc</span>
// The href may carry a locale prefix (/en/job/…, Sanofi) and there may be a
// job-type span/comment between the anchor and the <h2> (Sony), so both gaps are
// tolerated rather than assuming <a><h2> are adjacent (Disney's shape).
const ROW = /href="((?:\/[a-z]{2})?\/job\/[^"]+)"[^>]*>[\s\S]{0,300}?<h2>([^<]+)<\/h2>[\s\S]{0,900}?class="job-location"[^>]*>([\s\S]*?)<\/span>/gi;

function decode(s) {
  return String(s)
    .replace(/<[^>]+>/g, " ")                       // strip nested <strong>, spans
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ").trim();
}

function cleanLocation(raw) {
  return decode(raw)
    .replace(/^location:\s*/i, "")                  // Sanofi prefixes "Location:"
    .replace(/\((?:on-?site|remote|hybrid)\)/ig, "") // Sony appends "(Onsite)"
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRadancyListings(base, terms, maxPages = 6) {
  const seen = new Map();
  for (const term of terms) {
    for (let page = 1; page <= maxPages; page += 1) {
      const url = `${base}/search-jobs/${encodeURIComponent(term)}${page > 1 ? `?p=${page}` : ""}`;
      let html;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", Accept: "text/html" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        html = await res.text();
      } catch {
        break; // this term/page failed — move on rather than abandoning the source
      }
      let count = 0;
      for (const m of html.matchAll(ROW)) {
        count += 1;
        const url2 = base + m[1];
        const title = decode(m[2]);
        if (title) seen.set(url2, { title, url: url2, location: cleanLocation(m[3]) });
      }
      if (!count) break; // no more rows
    }
  }
  return [...seen.values()];
}

module.exports = { fetchRadancyListings };

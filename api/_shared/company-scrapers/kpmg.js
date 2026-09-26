// KPMG US — kpmguscareers.com/job-search/.
//
// The page server-renders complete rows (title, career level, practice, every
// office, and the /jobdetail/?jobId= link) to a plain request, so nothing here
// needs a browser. What it does NOT do is page: it returns 12 rows and honours
// no offset parameter under any name tried (offset, start, from, paged, p,
// skip, index, jobOffset all return the identical 12). What it does honour is
// `keyword`, so the board is read the way its own search box reads it — a few
// student terms, unioned — exactly as the Eightfold readers do.
//
// That makes this a deliberately partial view of a very large firm: every row
// is real and links to a live KPMG posting, but 12-per-term is a ceiling, not
// a complete list. Better a verified subset than a card that says nothing.
//
// Each row is rendered twice, as a grid card and as a list line. The grid says
// "9 Locations"; the list says "Advisory | Austin, TX; Boston, MA; …". The list
// copy is the one worth showing, so the LAST location cell wins and the
// practice-area prefix before "|" is dropped.
//
// kpmguscareers.com is KPMG LLP's US site, so every req is US.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const SEARCH = "https://www.kpmguscareers.com/job-search/";
const TERMS = ["intern", "internship", "co-op", "summer", "campus", "associate"];

function clean(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "–")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRows(html) {
  const rows = [];
  for (const chunk of String(html).split('<div class="search--item').slice(1)) {
    const id = (chunk.match(/href="\/jobdetail\/\?jobId=(\d+)"/) || [])[1];
    const title = clean((chunk.match(/class="h5 text-dark-grey">([\s\S]*?)<\/div>/) || chunk.match(/class="h4 mb-4">([\s\S]*?)<\/div>/) || [])[1]);
    if (!id || !title) continue;
    // Last cell is the list view's real office list; the grid's is "9 Locations".
    const cells = [...chunk.matchAll(/class="text-xs text-dark-grey">([\s\S]*?)<\/div>/g)].map((m) => clean(m[1]));
    const last = cells[cells.length - 1] || "";
    const location = last.includes("|") ? clean(last.slice(last.indexOf("|") + 1)) : last;
    rows.push({ title, url: `https://www.kpmguscareers.com/jobdetail/?jobId=${id}`, location, postedAt: null });
  }
  return rows;
}

module.exports = async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    let html;
    try {
      const res = await fetch(`${SEARCH}?keyword=${encodeURIComponent(term)}`, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`${res.status} kpmg ${term}`);
      html = await res.text();
    } catch (error) {
      // The first term failing is a real fault; a later one should not discard
      // the rows already gathered.
      if (!seen.size) throw error;
      continue;
    }
    for (const row of parseRows(html)) if (!seen.has(row.url)) seen.set(row.url, row);
  }
  return [...seen.values()];
};

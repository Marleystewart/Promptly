// Deloitte US — Avature at apply.deloitte.com.
//
// Recorded twice as unreadable, for two different wrong reasons. It is not a
// rendering problem: the search page server-renders every row (title, link,
// hiring entity, location) to a plain request. It is a volume problem — the
// page returns 10 results and ignores jobRecordsPerPage, and the unfiltered
// board is thousands of reqs, which no hourly refresh can walk.
//
// The way through is the page's own Hire Type facet, field 9339, whose ids
// appear in the page's banner config: 477 (campus/entry) and 478 (interns and
// summer scholars). `?9339=477,478` narrows the board to ~140 student reqs —
// 15 pages, fetched a few at a time rather than one after another.
//
// US-ness comes from the SITE, not the row: this is the /en_US Deloitte US
// portal and every req is posted by a US entity (Deloitte & Touche LLP,
// Deloitte Tax LLP, Deloitte Consulting LLP). Rows often say "Multiple
// Locations" precisely because a campus req covers many US offices, so a
// per-row location test would throw away most of the board. Deloitte's other
// member firms (Deloitte Canada, Deloitte UK) are separate portals we do not
// read here.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const BASE = "https://apply.deloitte.com/en_US/careers/SearchJobs";
const STUDENT_HIRE_TYPES = "477,478";
const PER_PAGE = 10;
const MAX_PAGES = 18;
const PAGE_CONCURRENCY = 4;

function clean(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#8211;|&ndash;/g, "–").replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePage(html) {
  const rows = [];
  for (const chunk of String(html).split('<article class="article--result').slice(1)) {
    const link = chunk.match(/<a href="(https:\/\/apply\.deloitte\.com\/[^"]*\/JobDetail\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!link) continue;
    const title = clean(link[2]);
    if (!title) continue;
    const subtitle = (chunk.match(/article__header__text__subtitle"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || "";
    const spans = [...subtitle.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/g)].map((m) => clean(m[1])).filter(Boolean);
    rows.push({ title, url: link[1], location: spans[spans.length - 1] || "", postedAt: null });
  }
  return rows;
}

async function page(offset) {
  const url = `${BASE}/?9339=${STUDENT_HIRE_TYPES}&jobOffset=${offset}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${res.status} deloitte ${offset}`);
  const html = await res.text();
  return { rows: parsePage(html), total: Number((html.match(/data-total="(\d+)"/) || [])[1]) || 0 };
}

module.exports = async function fetchListings() {
  const first = await page(0);
  const seen = new Map();
  for (const row of first.rows) seen.set(row.url, row);

  const offsets = [];
  const pages = Math.min(MAX_PAGES, Math.ceil(first.total / PER_PAGE));
  for (let p = 1; p < pages; p += 1) offsets.push(p * PER_PAGE);

  const queue = offsets[Symbol.iterator]();
  await Promise.all(Array.from({ length: PAGE_CONCURRENCY }, async () => {
    for (let next = queue.next(); !next.done; next = queue.next()) {
      // A later page failing should not discard the pages already read.
      try {
        for (const row of (await page(next.value)).rows) if (!seen.has(row.url)) seen.set(row.url, row);
      } catch { /* keep what we have */ }
    }
  }));

  return [...seen.values()];
};

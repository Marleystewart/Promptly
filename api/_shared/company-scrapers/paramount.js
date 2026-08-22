// Paramount runs its careers site on j2w (SAP SuccessFactors Recruiting
// Marketing) at careers.paramount.com. There's no clean JSON feed, but the
// search results are fully server-rendered and paginate via ?startrow=N. Each
// job tile exposes a stable numeric id we use to line up its title, apply URL,
// and a clean "City, ST, US, zip" location value. We read all pages and let
// detectCycle() in aggregator.js apply the intern/new-grad + US gate (the
// keyword path doesn't actually filter server-side, so we don't rely on it).

const BASE = "https://careers.paramount.com";
const PAGE_SIZE = 25;
const MAX_PAGES = 16; // ~400 reqs; the board is a few hundred

// Title link carries the job id in aria-describedby and the apply href.
const TITLE = /class="jobTitle-link[^"]*"[^>]*aria-describedby="jobSearchTileHelpText-(\d+)"[^>]*href="([^"]+)"[^>]*>\s*([\s\S]*?)<\/a>/gi;
// Location value div is keyed by the same job id.
const LOC = /id="job-(\d+)-desktop-section-location-value"[^>]*>([^<]+)</gi;

function decode(s) {
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ").trim();
}

async function fetchPage(startrow) {
  const url = `${BASE}/search-jobs${startrow ? `?startrow=${startrow}` : ""}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", Accept: "text/html" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} paramount`);
  return res.text();
}

async function fetchListings() {
  const seen = new Map();
  let lastFirstId = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let html;
    try {
      html = await fetchPage(page * PAGE_SIZE);
    } catch {
      break;
    }
    const locById = new Map();
    for (const m of html.matchAll(LOC)) locById.set(m[1], decode(m[2]));

    const idsThisPage = [];
    for (const m of html.matchAll(TITLE)) {
      const id = m[1];
      idsThisPage.push(id);
      const url = m[2].startsWith("http") ? m[2] : BASE + m[2];
      const title = decode(m[3]);
      if (title) seen.set(id, { title, url, location: locById.get(id) || "" });
    }
    if (!idsThisPage.length) break;
    // j2w returns the first page for out-of-range startrow, so stop once the
    // page repeats rather than looping to MAX_PAGES.
    if (idsThisPage[0] === lastFirstId) break;
    lastFirstId = idsThisPage[0];
  }
  return [...seen.values()];
}

module.exports = fetchListings;

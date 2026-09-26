// Reusable Avature careers-site adapter.
//
// Avature server-renders its result cards, so no private API or browser is
// needed. Each card is <article class="article--result"> containing the job
// title as a link to /JobDetail/... or /FolderDetail/..., and a meta line
// shaped like
//   "<Location> • Job ID: 15518 • 17-Feb-2026"
// Location matters: Avature tenants here are global employers, so the caller
// pairs this with usOnly() rather than shipping every country.
//
// Two portal generations, and they name the pager differently. Neither is
// documented; both are in the pager's own hrefs, which is where to look.
//
//   paging "job"     ?jobRecordsPerPage=40&jobOffset=0        (RGP, ManTech,
//                    MetLife) — the page size is honoured, so RGP's whole
//                    board is three requests.
//   paging "folder"  ?folderOffset=0                          (Maximus) — the
//                    page size is IGNORED and always six, so walking 398 reqs
//                    would be 67 requests. Pass `terms` instead and let the
//                    portal's own keyword search do the narrowing.
//
// The NEWER React portals (IBM, Slalom, CBRE, Avanade) are a different thing
// again: they serve a server no rows at all and expose no offset. Nothing here
// reaches those — see docs/SOURCE-HUNTING-FINDINGS.md.

const cheerio = require("cheerio");

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// Countries as Avature slugifies them, for the tenants that put no location on
// the card at all. Only an explicit country is read, so an unknown slug yields
// "" and the caller's US gate drops it rather than guessing.
const SLUG_COUNTRY = [
  ["United-States", "United States"],
  ["United-Kingdom-of-Great-Britain-and-Northern-Ireland", "United Kingdom"],
  ["United-Arab-Emirates", "United Arab Emirates"],
  ["Saudi-Arabia", "Saudi Arabia"],
  ["United-Kingdom", "United Kingdom"],
  ["Australia", "Australia"],
  ["Canada", "Canada"],
  ["India", "India"],
];

// "17-Feb-2026" -> ISO. Avature's own posted date, so a role lands in the month
// it actually dropped rather than the month Promptly first saw it.
//
// brassring.js imports this — Avature and BrassRing write dates the same way.
// Do not remove it because nothing in THIS file calls it.
function parsePostedAt(text) {
  const m = String(text || "").match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

// "/FolderDetail/United-Kingdom-…-Operations-Director-UK/43598" -> "United
// Kingdom". The country can follow a city ("London-United-Kingdom-…"), so the
// longest spelling is tested first — "United-Kingdom" would otherwise shadow
// the full "United-Kingdom-of-Great-Britain-and-Northern-Ireland".
function countryFromSlug(url) {
  const slug = (() => {
    try { return decodeURIComponent(String(url || "").split("/").slice(-2, -1)[0] || ""); }
    catch { return String(url || "").split("/").slice(-2, -1)[0] || ""; }
  })();
  for (const [needle, name] of SLUG_COUNTRY) {
    if (slug.includes(needle)) return name;
  }
  return "";
}

function parseCard($, element, origin) {
  const card = $(element);
  // Both separators, deliberately. ManTech and MetLife write
  // "/JobDetail/<slug>/<id>"; RGP writes "/Careers/JobDetail?jobTitle=…&jobId=…".
  // The original selector required the trailing slash, so RGP's 113 rows all
  // parsed to null and the board read as empty.
  const link = card.find('a[href*="/JobDetail"], a[href*="/FolderDetail"]').first();
  const href = link.attr("href");
  const title = link.text().replace(/\s+/g, " ").trim();
  if (!href || !title) return null;

  // When the tenant gives the location its own span, that is the precise
  // answer and nothing else needs guessing at. RGP's cards have no bullets, so
  // the meta-line parse below returns the whole line — "California, United
  // States Consulting", with the job category glued on.
  const span = card.find(".list-item-locationBuiltIn").first().text().replace(/\s+/g, " ").trim();

  // Everything after the title is the meta line; the location is its first
  // bullet-separated segment.
  const text = card.text().replace(/\s+/g, " ").trim();
  const after = text.startsWith(title) ? text.slice(title.length) : text;
  const segments = after.split("•").map((s) => s.trim()).filter(Boolean);
  // Not every Avature tenant puts a location on the card — Jack Henry's meta
  // line is just "Posted <date>" followed by share links. Strip that furniture
  // and, if what's left doesn't look like a place, return "" rather than a
  // sentence. Blank is safe: usOnly() drops it instead of guessing it's US.
  let location = (segments[0] || "")
    .replace(/\bposted\b\s*\d{1,2}-[A-Za-z]{3}-\d{4}/gi, "")
    .replace(/\bshare this job\b[\s\S]*$/i, "")
    .replace(/\bapply\b/gi, "")
    .replace(/\bnow\b\s*$/i, "")
    .trim();
  if (location.length > 80 || /\bshare\b/i.test(location)) location = "";

  if (span) location = span;
  // Maximus leaves the location slot to a posted date and a job id, and writes
  // the country into the URL slug instead. That is the board's own wording, so
  // it is read rather than inferred.
  if (!location) location = countryFromSlug(href);

  let url;
  try { url = new URL(href, origin).href; } catch { return null; }
  return { title, url, location, postedAt: parsePostedAt(after) };
}

// searchUrl is the tenant's SearchJobs page.
//
// `pages`/`perPage` keep the original meaning and defaults, so ManTech's
// { pages: 5, perPage: 10 } and MetLife's bare call behave exactly as before.
async function fetchAvatureListings(searchUrl, { pages = 10, perPage = 10, paging = "job", terms = [""] } = {}) {
  const origin = new URL(searchUrl).origin;
  const folder = paging === "folder";
  const sizeParam = folder ? "folderRecordsPerPage" : "jobRecordsPerPage";
  const offsetParam = folder ? "folderOffset" : "jobOffset";
  // A folder-paged portal returns six however many are asked for, so the
  // offset must step by six or rows are skipped.
  const step = folder ? 6 : perPage;
  const seen = new Map();

  for (const term of terms) {
    for (let page = 0; page < pages; page += 1) {
      const url = new URL(searchUrl);
      url.searchParams.set(sizeParam, String(perPage));
      url.searchParams.set(offsetParam, String(page * step));
      if (term) url.searchParams.set("search", term);

      let html;
      try {
        const res = await fetch(url, {
          headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) break;
        html = await res.text();
      } catch {
        break; // this term failed — keep what the others found
      }

      const $ = cheerio.load(html);
      const cards = $("article.article--result");
      let added = 0;
      cards.each((_, element) => {
        const job = parseCard($, element, origin);
        if (!job || seen.has(job.url)) return;
        seen.set(job.url, job);
        added += 1;
      });
      if (!cards.length || added === 0) break;
    }
  }

  return [...seen.values()];
}

module.exports = { fetchAvatureListings, parsePostedAt, parseCard, countryFromSlug };

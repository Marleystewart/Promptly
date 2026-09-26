// Avature career portals.
//
// Recorded for a long time as unreadable ("a fixed latest-20 with no offset").
// That was wrong in both halves: the list IS server-rendered, and it DOES page
// — the controls are just in the markup rather than in any documentation, and
// two portal generations name them differently:
//
//   RGP      /Careers/SearchJobs/?jobRecordsPerPage=40&jobOffset=0
//   Maximus  /careers/SearchJobs/?folderOffset=0        (page size fixed at 6)
//
// So a source says which family its portal uses. RGP honours a page size of 40
// and its whole board is three requests; Maximus ignores the size entirely, so
// it is read through its own keyword search instead of walking 398 reqs six at
// a time.
//
// Every row is the same shape in both:
//
//   <article class="article article--result" id="article--1">
//     <h3 class="article__header__text__title …"><a class="link" href="…">TITLE</a></h3>
//     <div class="article__header__text__subtitle">
//       <span class="list-item-locationBuiltIn">California, United States</span>
//
// The location span is the difference. RGP fills it; Maximus has only a posted
// date and a job id there, and writes the country into the URL slug instead
// ("/FolderDetail/United-States-Senior-Cybersecurity-Engineer…/43712"). That
// slug is the board's own wording, so it is read rather than guessed at — and
// only an explicit country is accepted, never a bare city.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const MAX_PAGES = 6;

// Countries as Avature slugifies them. Only used to read a country off the
// slug, so an unknown one yields "" (no location) rather than a wrong one.
const SLUG_COUNTRY = [
  ["United-States", "United States"],
  ["Canada", "Canada"],
  ["United-Kingdom-of-Great-Britain-and-Northern-Ireland", "United Kingdom"],
  ["United-Kingdom", "United Kingdom"],
  ["Australia", "Australia"],
  ["India", "India"],
  ["Saudi-Arabia", "Saudi Arabia"],
  ["United-Arab-Emirates", "United Arab Emirates"],
];

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#8211;|&ndash;/g, "–").replace(/&#8226;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "/FolderDetail/United-Kingdom-…-Operations-Director-UK/43598" -> "United Kingdom".
// The country can follow a city ("London-United-Kingdom-…"), so the longest
// spelling is tested first — "United-Kingdom" would otherwise shadow the full
// "United-Kingdom-of-Great-Britain-and-Northern-Ireland".
function countryFromSlug(url) {
  const slug = decodeURIComponent(String(url || "").split("/").slice(-2, -1)[0] || "");
  for (const [needle, name] of SLUG_COUNTRY) {
    if (slug.includes(needle)) return name;
  }
  return "";
}

function parseArticles(html, origin) {
  const out = [];
  const blocks = String(html).split(/<article[^>]*class="[^"]*article--result[^"]*"/i).slice(1);
  for (const block of blocks) {
    const link = block.match(/<h3[^>]*article__header__text__title[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const title = clean(link[2]);
    if (!title) continue;
    const href = link[1].replace(/&amp;/g, "&");
    const url = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
    const built = block.match(/<span[^>]*list-item-locationBuiltIn[^>]*>([\s\S]*?)<\/span>/i);
    out.push({
      title,
      url,
      location: built ? clean(built[1]) : countryFromSlug(url),
      postedAt: null,
    });
  }
  return out;
}

async function page(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} avature ${url}`);
  return res.text();
}

// portal: the SearchJobs URL, e.g. "https://careers.rgp.com/Careers/SearchJobs".
// paging: "job" (page size honoured) or "folder" (fixed page size, so the
//         portal's own keyword search does the narrowing instead).
async function fetchAvatureListings(portal, { paging = "job", perPage = 40, terms = [""] } = {}) {
  const origin = new URL(portal).origin;
  const sizeParam = paging === "folder" ? "folderRecordsPerPage" : "jobRecordsPerPage";
  const offsetParam = paging === "folder" ? "folderOffset" : "jobOffset";
  const step = paging === "folder" ? 6 : perPage;
  const seen = new Map();

  for (const term of terms) {
    for (let index = 0; index < MAX_PAGES; index += 1) {
      const url = new URL(portal);
      url.searchParams.set(sizeParam, String(perPage));
      url.searchParams.set(offsetParam, String(index * step));
      if (term) url.searchParams.set("search", term);
      let rows;
      try {
        rows = parseArticles(await page(url.toString()), origin);
      } catch {
        break; // this term failed — keep what the others found
      }
      const before = seen.size;
      for (const row of rows) if (!seen.has(row.url)) seen.set(row.url, row);
      // A short page is the last one; no new rows means the pager is not moving.
      if (rows.length < step || seen.size === before) break;
    }
  }
  return [...seen.values()];
}

module.exports = { fetchAvatureListings, parseArticles, countryFromSlug, clean };

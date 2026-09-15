// WTW (Willis Towers Watson) — careers.wtwco.com, a Yello-built careers site.
//
// The search page server-renders a results table (a plain fetch works; no
// script needed), 30 rows a page:
//   <tr data-job-url="https://careers.wtwco.com/jobs/<slug>">
//     <a aria-label="Title: Early Careers: … Internship- Fall 2027" …>
//     <li aria-label="Location: Chicago, Illinois, United States">
// The site's own country filter (country_codes[]=US) is applied server-side,
// which cuts ~600 worldwide rows to ~200 US ones — seven pages, not twenty.
const { usOnly } = require("../us-location");

const ORIGIN = "https://careers.wtwco.com";
const MAX_PAGES = 10;

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parseRows(html) {
  return String(html).split(/<tr[^>]*data-job-url="/).slice(1).map((chunk) => {
    const url = decode(chunk.slice(0, chunk.indexOf('"')));
    const title = decode((chunk.match(/aria-label="Title: ([^"]*)"/) || [])[1]);
    const locations = [...chunk.split("</tr>")[0].matchAll(/aria-label="Location: ([^"]*)"/g)].map((m) => decode(m[1]));
    return { title, url, location: locations.join("; "), postedAt: null };
  }).filter((row) => row.title && /^https:\/\//.test(row.url));
}

module.exports = async function fetchListings() {
  const seen = new Map();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await fetch(`${ORIGIN}/jobs/search?country_codes%5B%5D=US&page=${page}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (page === 1) throw new Error(`${res.status} wtw`);
      break;
    }
    const rows = parseRows(await res.text());
    const before = seen.size;
    for (const row of rows) if (!seen.has(row.url)) seen.set(row.url, row);
    if (rows.length < 30 || seen.size === before) break;
  }
  return usOnly([...seen.values()]);
};

module.exports.parseRows = parseRows;

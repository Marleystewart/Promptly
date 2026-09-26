// Boston Strategic Partners — its own careers page, which IS the board. Filed
// for a long time as "applications by email; no board exists"; the openings are
// WordPress posts under /index.php/careers/<slug>/, each with its own page.
//
// Neither the index nor a job page states a location. The firm publishes one
// office — 4 Wellington St., Boston, MA — on its contact page and its footer,
// so that is what a req is at; it is their own stated address rather than an
// inference from the name.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const CAREERS = "https://bostonsp.com/index.php/join-bsp/";
const OFFICE = "Boston, MA";

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#8217;|&#0?39;/g, "'").replace(/&#8211;/g, "–")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOpenings(html) {
  const seen = new Map();
  for (const m of String(html).matchAll(/<a[^>]*href="([^"]*\/careers\/[a-z0-9-]+\/?)"[^>]*>([\s\S]{0,140}?)<\/a>/gi)) {
    const title = clean(m[2]);
    // Every opening is linked twice, once by its title and once by a "Read
    // More »" button. Keeping the first occurrence keeps the title.
    if (!title || /^read more/i.test(title)) continue;
    const url = m[1].startsWith("http") ? m[1] : `https://bostonsp.com${m[1]}`;
    if (!seen.has(url)) seen.set(url, { title, url, location: OFFICE, postedAt: null });
  }
  return [...seen.values()];
}

module.exports = async function fetchListings() {
  const res = await fetch(CAREERS, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} bostonsp`);
  return parseOpenings(await res.text());
};
module.exports.parseOpenings = parseOpenings;

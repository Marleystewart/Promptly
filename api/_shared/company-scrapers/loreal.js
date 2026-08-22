// L'Oreal's first-party Avature portal server-renders current US search rows.
// The country facet below is the portal's own United States filter; we retain
// a positive location check as a second guard.

const cheerio = require("cheerio");
const { usOnly } = require("../us-location");

const SEARCH = "https://careers.loreal.com/en_US/jobs/SearchJobs";
const TERMS = ["intern", "internship", "2027", "graduate"];
const PAGE_SIZE = 20;
const MAX_PAGES = 5;

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const url = new URL(SEARCH);
      url.searchParams.set("3_110_3", "18076"); // United States
      url.searchParams.set("search", term);
      url.searchParams.set("jobOffset", String(page * PAGE_SIZE));
      url.searchParams.set("jobRecordsPerPage", String(PAGE_SIZE));

      let html;
      try {
        const res = await fetch(url, {
          headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} loreal`);
        html = await res.text();
      } catch {
        break;
      }

      const $ = cheerio.load(html);
      const rows = $("article h3.article__header__text__title a[href]");
      rows.each((_, anchor) => {
        const card = $(anchor).closest("article");
        const title = $(anchor).text().replace(/\s+/g, " ").trim();
        const postingUrl = new URL($(anchor).attr("href"), SEARCH).href;
        const location = card.find(".article__header__text__subtitle span").first()
          .text().replace(/\s+/g, " ").trim();
        if (title && /\/jobs\/JobDetail\//.test(postingUrl)) {
          seen.set(postingUrl, { title, url: postingUrl, location });
        }
      });
      if (rows.length < PAGE_SIZE) break;
    }
  }
  return usOnly([...seen.values()]);
}

module.exports = fetchListings;

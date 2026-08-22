// adidas renders its SuccessFactors inventory on its first-party careers
// search page.  Each result contains the real jobs.adidas-group.com apply URL.

const cheerio = require("cheerio");
const { usOnly } = require("../us-location");

const SEARCH = "https://careers.adidas-group.com/jobs";
const TERMS = ["intern", "internship", "2027", "graduate"];
const PAGE_SIZE = 10;
const MAX_PAGES = 5;

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const url = new URL(SEARCH);
      url.searchParams.set("keywords", term);
      url.searchParams.set("locale", "en");
      url.searchParams.set("offset", String(page * PAGE_SIZE));

      let html;
      try {
        const res = await fetch(url, {
          headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} adidas`);
        html = await res.text();
      } catch {
        break;
      }

      const $ = cheerio.load(html);
      const rows = $("h3.job-list__title");
      rows.each((_, heading) => {
        const card = $(heading).closest(".job-list__job");
        const title = $(heading).text().replace(/\s+/g, " ").trim();
        const postingUrl = String(card.find("a[href]").first().attr("href") || "").trim();
        const location = card.find(".job-list__facts").text()
          .replace(/\s+/g, " ").trim().split("|")[0].trim();
        if (title && /^https:\/\/jobs\.adidas-group\.com\/job\//i.test(postingUrl)) {
          seen.set(postingUrl, { title, url: postingUrl, location });
        }
      });
      if (rows.length < PAGE_SIZE) break;
    }
  }
  return usOnly([...seen.values()]);
}

module.exports = fetchListings;

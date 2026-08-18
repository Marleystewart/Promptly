// Two Sigma publishes its roles through an Avature careers page. The result
// cards are fully present in the server-rendered HTML, including locations.

const cheerio = require("cheerio");
const SEARCH_URL = "https://careers.twosigma.com/careers/OpenRoles";

async function fetchListings() {
  const jobs = [];
  const seen = new Set();

  for (let offset = 0; offset < 500; offset += 10) {
    const url = new URL(SEARCH_URL);
    url.searchParams.set("jobRecordsPerPage", "10");
    url.searchParams.set("jobOffset", String(offset));

    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`${res.status} twosigma`);
    const $ = cheerio.load(await res.text());
    const cards = $("article.article--result");
    let added = 0;

    cards.each((_, element) => {
      const card = $(element);
      const link = card.find('a.link[href*="/careers/JobDetail/"]').first();
      const jobUrl = link.attr("href");
      if (!jobUrl || seen.has(jobUrl)) return;
      seen.add(jobUrl);
      added += 1;
      jobs.push({
        title: link.text().replace(/\s+/g, " ").trim(),
        url: jobUrl,
        location: card
          .find(".article__header__content__text > span.paragraph_inner-span")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim(),
      });
    });

    if (cards.length < 10 || added === 0) break;
  }

  return jobs.filter((job) => job.title && job.url);
}

module.exports = fetchListings;

// D. E. Shaw's official internships page includes its current requisitions as
// server-rendered job cards, so no private API or browser automation is needed.

const cheerio = require("cheerio");
const BASE_URL = "https://www.deshaw.com";
const LIST_URL = `${BASE_URL}/careers/internships`;

async function fetchListings() {
  const res = await fetch(LIST_URL, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} deshaw`);

  const $ = cheerio.load(await res.text());
  const jobs = [];
  $(".job").each((_, element) => {
    const card = $(element);
    const href = card.find("a#job-description-a-tag").first().attr("href");
    if (!href) return;
    jobs.push({
      title: card.find(".job-display-name").first().text().replace(/\s+/g, " ").trim(),
      url: new URL(href, BASE_URL).href,
      location: card.find(".location").first().text().replace(/\s+/g, " ").trim(),
    });
  });

  return jobs.filter((job) => job.title && job.url);
}

module.exports = fetchListings;

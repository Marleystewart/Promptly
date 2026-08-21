// Lord Abbett uses iCIMS. Its public student/recent-graduate facet is a
// first-party, server-rendered list and does not require cookies or auth.

const cheerio = require("cheerio");

const BOARD_URL = "https://careers-lordabbett.icims.com/jobs/search";

async function fetchListings() {
  const params = new URLSearchParams({
    ss: "1",
    searchPositionType: "18702", // Students and Recent Graduates
    searchLocation: "12781--",   // United States
    in_iframe: "1",
  });
  const res = await fetch(`${BOARD_URL}?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} lordabbett`);

  const $ = cheerio.load(await res.text());
  const jobs = [];
  $(".iCIMS_JobCardItem").each((_, item) => {
    const link = $(item).find('a.iCIMS_Anchor[href*="/jobs/"]').first();
    const title = link.find("h3").text().replace(/\s+/g, " ").trim();
    const rawUrl = link.attr("href");
    const location = $(item).find(".iCIMS_JobHeaderData").text().replace(/\s+/g, " ").trim();
    if (!rawUrl || !title) return;
    const url = new URL(rawUrl);
    url.searchParams.delete("in_iframe");
    jobs.push({ title, url: url.href, location: location ? `${location}, United States` : "United States" });
  });
  return jobs;
}

module.exports = fetchListings;

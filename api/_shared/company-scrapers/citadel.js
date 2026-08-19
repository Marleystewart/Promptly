// Citadel protects its rendered careers pages with Cloudflare, but publishes
// the live career inventory in its official Yoast XML sitemap. A removed job
// disappears from this sitemap, making it a stable first-party source without
// attempting to work around the site's bot protection.

const cheerio = require("cheerio");
const SITEMAP_URL = "https://www.citadel.com/career-sitemap.xml";

function titleFromUrl(jobUrl) {
  const slug = new URL(jobUrl).pathname.split("/").filter(Boolean).pop() || "";
  const locale = slug.match(/-(us|asia|europe)$/)?.[1];
  const words = (locale ? slug.slice(0, -(locale.length + 1)) : slug).split("-");
  const special = { ai: "AI", bs: "BS", ms: "MS", phd: "PhD" };
  const title = words.map((word) => special[word] || `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
  return locale === "us" ? `${title} (US)` : title;
}

function locationFromUrl(jobUrl) {
  const slug = new URL(jobUrl).pathname.toLowerCase();
  if (/-us\/$/.test(slug)) return "United States";
  if (/-asia\/$/.test(slug)) return "Hong Kong; Singapore";
  if (/-europe\/$/.test(slug)) return "London; Zurich";
  return "";
}

async function fetchListings() {
  const res = await fetch(SITEMAP_URL, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} citadel sitemap`);

  const $ = cheerio.load(await res.text(), { xmlMode: true });
  const jobs = [];
  $("url > loc").each((_, element) => {
    const url = $(element).text().trim();
    // Campus-referral pages are internal referral forms, not public job reqs.
    if (!url || /campus-referrals/i.test(url)) return;
    if (!/(?:intern|graduate|full-time-program-20\d{2})/i.test(url)) return;
    jobs.push({ title: titleFromUrl(url), url, location: locationFromUrl(url) });
  });
  return jobs;
}

module.exports = fetchListings;

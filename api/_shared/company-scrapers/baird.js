// Baird's rendered job pages are Cloudflare-protected, but its official XML
// sitemap is public and contains every current requisition URL. Removed roles
// disappear from the sitemap, so it is a reliable first-party inventory.

const cheerio = require("cheerio");

const SITEMAP_URL = "https://www.bairdcareers.com/sitemap.xml";

function titleFromUrl(jobUrl) {
  const parts = new URL(jobUrl).pathname.split("/").filter(Boolean);
  const slug = parts[parts.length - 1] || "";
  const special = { ib: "IB", it: "IT", pwm: "PWM", us: "US" };
  return slug.split("-").map((word) => special[word] || `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
}

async function fetchListings() {
  const res = await fetch(SITEMAP_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} baird sitemap`);

  const $ = cheerio.load(await res.text(), { xmlMode: true });
  const jobs = [];
  $("url > loc").each((_, element) => {
    const url = $(element).text().trim();
    if (!/\/jobs\/r\d+\//i.test(url)) return;
    if (!/(?:intern|summer-202[678]|graduate|full-time)/i.test(url)) return;
    // Baird's current non-US campus URLs use "programme" or an explicit
    // country/city slug; those must not be attributed to the US pipeline.
    if (/(?:programme|london|frankfurt|toronto|canada|uk)\//i.test(url)) return;
    jobs.push({ title: titleFromUrl(url), url, location: "United States" });
  });
  return jobs;
}

module.exports = fetchListings;

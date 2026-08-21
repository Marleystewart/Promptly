// Nuveen openings are published on parent company TIAA's first-party careers
// site. Search is server-rendered; detail pages identify the Nuveen business,
// which prevents unrelated TIAA roles from being mislabeled as Nuveen.

const cheerio = require("cheerio");

const ORIGIN = "https://careers.tiaa.org";
const TERMS = ["nuveen intern", "nuveen internship", "nuveen rotational", "nuveen graduate"];

async function search(term) {
  const url = new URL("/jobs", ORIGIN);
  url.searchParams.set("keyword", term);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} nuveen search`);
  const $ = cheerio.load(await res.text());
  const jobs = [];
  $(".results-list__item").each((_, item) => {
    const link = $(item).find("a.results-list__item-title--link").first();
    const href = link.attr("href");
    const title = link.text().replace(/\s+/g, " ").trim();
    const location = $(item).find(".results-list__item-street--label").text().replace(/\s+/g, " ").trim();
    if (href && title) jobs.push({ title, url: new URL(href, ORIGIN).href, location });
  });
  return jobs;
}

async function isNuveen(job) {
  try {
    const res = await fetch(job.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    return res.ok && /\bNuveen\b/i.test(await res.text());
  } catch {
    return false;
  }
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    let jobs;
    try {
      jobs = await search(term);
    } catch {
      continue;
    }
    for (const job of jobs) seen.set(job.url, job);
  }
  const jobs = [...seen.values()];
  const matches = await Promise.all(jobs.map(isNuveen));
  return jobs.filter((_, index) => matches[index]);
}

module.exports = fetchListings;

// Reusable Avature careers-site adapter.
//
// Avature server-renders its result cards, so no private API or browser is
// needed. Each card is <article class="article--result"> containing the job
// title as a link to /JobDetail/..., and a meta line shaped like
//   "<Location> • Job ID: 15518 • 17-Feb-2026"
// Location matters: Avature tenants here are global employers, so the caller
// pairs this with usOnly() rather than shipping every country.

const cheerio = require("cheerio");

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

// "17-Feb-2026" -> ISO. Avature's own posted date, so a role lands in the month
// it actually dropped rather than the month Promptly first saw it.
function parsePostedAt(text) {
  const m = String(text || "").match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  const d = new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function parseCard($, element, origin) {
  const card = $(element);
  const link = card.find('a[href*="/JobDetail/"]').first();
  const href = link.attr("href");
  const title = link.text().replace(/\s+/g, " ").trim();
  if (!href || !title) return null;

  // Everything after the title is the meta line; the location is its first
  // bullet-separated segment.
  const text = card.text().replace(/\s+/g, " ").trim();
  const after = text.startsWith(title) ? text.slice(title.length) : text;
  const segments = after.split("•").map((s) => s.trim()).filter(Boolean);
  // Not every Avature tenant puts a location on the card — Jack Henry's meta
  // line is just "Posted <date>" followed by share links. Strip that furniture
  // and, if what's left doesn't look like a place, return "" rather than a
  // sentence. Blank is safe: usOnly() drops it instead of guessing it's US.
  let location = (segments[0] || "")
    .replace(/\bposted\b\s*\d{1,2}-[A-Za-z]{3}-\d{4}/gi, "")
    .replace(/\bshare this job\b[\s\S]*$/i, "")
    .replace(/\bapply\b/gi, "")
    .replace(/\bnow\b\s*$/i, "")
    .trim();
  if (location.length > 80 || /\bshare\b/i.test(location)) location = "";

  let url;
  try { url = new URL(href, origin).href; } catch { return null; }
  return { title, url, location, postedAt: parsePostedAt(after) };
}

// searchUrl is the tenant's SearchJobs page. Paginates via Avature's own
// jobRecordsPerPage/jobOffset parameters until a page adds nothing new.
async function fetchAvatureListings(searchUrl, { pages = 10, perPage = 10 } = {}) {
  const origin = new URL(searchUrl).origin;
  const seen = new Map();

  for (let page = 0; page < pages; page += 1) {
    const url = new URL(searchUrl);
    url.searchParams.set("jobRecordsPerPage", String(perPage));
    url.searchParams.set("jobOffset", String(page * perPage));

    let html;
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) break;
      html = await res.text();
    } catch {
      break;
    }

    const $ = cheerio.load(html);
    const cards = $("article.article--result");
    let added = 0;
    cards.each((_, element) => {
      const job = parseCard($, element, origin);
      if (!job || seen.has(job.url)) return;
      seen.set(job.url, job);
      added += 1;
    });
    if (!cards.length || added === 0) break;
  }

  return [...seen.values()];
}

module.exports = { fetchAvatureListings, parsePostedAt };

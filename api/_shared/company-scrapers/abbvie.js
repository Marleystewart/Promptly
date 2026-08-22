// AbbVie runs its careers site on Attrax (careers.abbvie.com), fully
// server-rendered — no JSON feed and no phApp.ddo. Each result is an
// "attrax-vacancy-tile__title" link whose href encodes the location:
//   /en/job/<title-slug>-in-<city>-<st>-jid-<id>
// We parse those tiles, rebuild the location from the slug, and keep only
// positively-confirmed US roles (AbbVie is global and the slug is the only
// location signal). detectCycle() in aggregator.js then applies the student
// gate. AbbVie's keyword search matches substrings ("intern" also hits
// "internal"), so we don't trust it — we page through and let the gate filter.

const BASE = "https://careers.abbvie.com";
const TERMS = ["intern", "graduate", "student", "co-op"];
const MAX_PAGES = 8;

const { usOnly } = require("../us-location");

// last "-in-<city>-<ST>-jid-<id>" wins (some titles contain an earlier "-in-").
const SLUG_LOC = /^\/en\/job\/.*-in-([a-z0-9-]+)-([a-z]{2})-jid-\d+$/i;
const TILE = /class="attrax-vacancy-tile__title[^"]*"[^>]*href="(\/en\/job\/[^"]+)"[^>]*>\s*([\s\S]*?)<\/a>/gi;

function decode(s) {
  return String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ").trim();
}

function locationFromSlug(path) {
  const m = path.match(SLUG_LOC);
  if (!m) return ""; // no parseable US-style "-city-ST-jid" tail → treat as non-US
  const city = m[1].split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return `${city}, ${m[2].toUpperCase()}`;
}

async function fetchPage(term, page) {
  const url = `${BASE}/en/jobs?keywords=${encodeURIComponent(term)}${page > 1 ? `&page=${page}` : ""}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", Accept: "text/html" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} abbvie`);
  return res.text();
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    let lastFirst = null;
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      let html;
      try {
        html = await fetchPage(term, page);
      } catch {
        break;
      }
      const paths = [];
      for (const m of html.matchAll(TILE)) {
        const path = m[1];
        paths.push(path);
        const title = decode(m[2]);
        if (title && !seen.has(path)) seen.set(path, { title, url: BASE + path, location: locationFromSlug(path) });
      }
      if (!paths.length || paths[0] === lastFirst) break; // no more / page repeats
      lastFirst = paths[0];
    }
  }
  return usOnly([...seen.values()]);
}

module.exports = fetchListings;

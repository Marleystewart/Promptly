// The Estée Lauder Companies careers site runs Eightfold's newer PCSX search.
// The public endpoint requires the same short-lived CSRF token and cookies the
// browser receives from the careers page, then returns current position IDs,
// titles, and structured locations.

const BASE = "https://careers.elcompanies.com";
const DOMAIN = "elcompanies.com";
const TERMS = ["intern", "internship", "2027", "graduate"];
const PAGE_SIZE = 10;
const MAX_PAGES = 10;
const { usOnly } = require("../us-location");

async function bootstrap() {
  const res = await fetch(`${BASE}/careers?domain=${DOMAIN}`, {
    headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} estee-lauder bootstrap`);
  const html = await res.text();
  const token = html.match(/name="_csrf" content="([^"]+)"/)?.[1];
  if (!token) throw new Error("Estée Lauder CSRF token missing");

  const setCookies = typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")].filter(Boolean);
  const cookie = setCookies.map((value) => String(value).split(";")[0]).join("; ");
  return { token, cookie };
}

async function fetchPage(term, start, session) {
  const url = new URL(`${BASE}/api/pcsx/search`);
  url.searchParams.set("domain", DOMAIN);
  url.searchParams.set("query", term);
  url.searchParams.set("location", "");
  url.searchParams.set("start", String(start));
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
      "X-CSRF-Token": session.token,
      "X-Browser-Request-Time": String(Date.now() / 1000),
      Cookie: session.cookie,
      Referer: `${BASE}/careers?domain=${DOMAIN}`,
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} estee-lauder search`);
  const body = await res.json();
  return body?.data || {};
}

async function fetchListings() {
  const session = await bootstrap();
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      let data;
      try {
        data = await fetchPage(term, page * PAGE_SIZE, session);
      } catch {
        break;
      }
      const positions = Array.isArray(data.positions) ? data.positions : [];
      for (const position of positions) {
        const title = String(position.name || "").replace(/\s+/g, " ").trim();
        const path = String(position.positionUrl || "").trim();
        const locations = Array.isArray(position.locations) && position.locations.length
          ? position.locations
          : position.standardizedLocations;
        const location = (Array.isArray(locations) ? locations : [])
          .map((value) => String(value).replace(/\s+/g, " ").trim())
          .filter(Boolean).join("; ");
        if (!title || !/^\/careers\/job\/\d+/.test(path)) continue;
        const posting = { title, url: new URL(path, BASE).href, location };
        seen.set(posting.url, posting);
      }
      const total = Number(data.count) || 0;
      if (!positions.length || (page + 1) * PAGE_SIZE >= total) break;
    }
  }
  return usOnly([...seen.values()]);
}

module.exports = fetchListings;

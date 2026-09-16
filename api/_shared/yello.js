// Yello job boards (<tenant>.recsolu.com) — Kearney recruits here.
//
// The board page server-renders only its first 25 rows and ignores ?page=.
// The page itself loads more, and searches, from
//   GET <host>/job_boards/<board token>/search?query=<q>&page_number=<n>
// which answers { html, more_requisitions } to a plain fetch — no token. The
// token is on the board page (data-search-url), not the "1" in its address.
//
// One row:
//   <a class="search-results__req_title" href="/jobs/<id>?job_board_id=…">Title</a>
//   <div><span>Full-time</span><span>Americas</span><span>Chicago, Boston</span></div>
//
// "Americas" covers Canada and Latin America as well, so a row counts as US
// only when its region is Americas AND one of its cities is in geo.js's US
// city table — matched EXACTLY, so "Mexico City" can never match a US town.

const geo = require("../../geo.js");

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";

const US_CITY = new Map(Object.keys(geo.CITIES || {}).map((key) => {
  const [city, state] = key.split(",").map((s) => s.trim());
  const label = `${city.replace(/\b[a-z]/g, (c) => c.toUpperCase())}, ${String(state).toUpperCase()}, United States`;
  return [city, label];
}));

function decode(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parseRows(html, host) {
  const rows = [];
  const re = /class="search-results__req_title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<div>((?:\s*<span>[\s\S]*?<\/span>)*)\s*<\/div>/g;
  let m;
  while ((m = re.exec(String(html)))) {
    const spans = [...m[3].matchAll(/<span>([\s\S]*?)<\/span>/g)].map((s) => decode(s[1]));
    const region = spans.find((s) => /^(americas|north america|europe|asia pacific|middle east)/i.test(s)) || "";
    const cities = decode(spans[spans.length - 1] || "").split(/\s*,\s*/).filter(Boolean);
    const usCities = /^(americas|north america)$/i.test(region)
      ? cities.map((c) => US_CITY.get(c.toLowerCase())).filter(Boolean)
      : [];
    rows.push({
      title: decode(m[2]),
      url: new URL(decode(m[1]), `https://${host}`).href,
      location: usCities.length ? usCities.join("; ") : [cities.join(", "), region].filter(Boolean).join(", "),
      postedAt: null,
      us: usCities.length > 0,
    });
  }
  return rows;
}

async function fetchYelloListings(host, boardToken, { terms = ["intern", "summer", "analyst", "graduate"], maxPages = 4 } = {}) {
  const seen = new Map();
  for (const query of terms) {
    for (let page = 1; page <= maxPages; page += 1) {
      let data;
      try {
        const url = `https://${host}/job_boards/${encodeURIComponent(boardToken)}/search?query=${encodeURIComponent(query)}&page_number=${page}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json", "User-Agent": UA },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} yello ${host}`);
        data = await res.json();
      } catch (error) {
        if (!seen.size && query === terms[0] && page === 1) throw error; // board down: report it
        break;
      }
      const rows = parseRows(data.html, host);
      const before = seen.size;
      for (const row of rows) if (!seen.has(row.url)) seen.set(row.url, row);
      if (!data.more_requisitions || !rows.length || seen.size === before) break;
    }
  }
  return [...seen.values()];
}

function usYelloOnly(rows) {
  return rows.filter((r) => r.us).map(({ us: _us, ...row }) => row);
}

module.exports = { fetchYelloListings, usYelloOnly, parseRows };

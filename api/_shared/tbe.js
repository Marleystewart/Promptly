// Taleo Business Edition — phg.tbe.taleo.net.
//
// A different product from the Taleo in taleo.js. That one reads
// <tenant>.taleo.net/careersection (Taleo Enterprise); this is the small-business
// edition, and the two share nothing but a brand.
//
// Reading it takes two requests, because one is not enough:
//
//   1. GET /jobSearch?org=<ORG>&cws=<N>    — returns the search FORM, and sets
//      a JSESSIONID. Asked for results without it you get the form again, 200
//      and 98KB of it, which is why this board looked unreadable.
//   2. GET /searchResults?org=<ORG>&cws=<N> with that cookie — the rows.
//
// No login, no challenge, nothing a visitor is not handed on arrival: the same
// public-session pattern as csod.js and the Paycom reader.
//
// Rows are ten to a page and page with `rowFrom`. Each row is
//
//   <h4 class="oracletaleocwsv2-head-title"><a ... rid=NNNN>TITLE</a></h4>
//   <div tabindex="0">LOCATION</div>
//
// board = "<pathSegment>/<ORG>/<cws>", e.g. "phg02/CENTCONS/38" — the segment
// is part of the URL because TBE shards customers across phg01, phg02 and so on.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const PAGE = 10;
const MAX_PAGES = 12;

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Title and location come from one block, so they are parsed together — pairing
// them by index across two separate scans is how rows end up mislabelled.
function parseRows(html, base) {
  const rows = [];
  const re = /<h4 class="oracletaleocwsv2-head-title">\s*<a href="([^"]*rid=(\d+))"[^>]*>([\s\S]*?)<\/a>\s*<\/h4>\s*<div[^>]*>([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html))) {
    const title = clean(m[3]);
    if (!title) continue;
    rows.push({
      title,
      url: m[1].startsWith("http") ? m[1].replace(/&amp;/g, "&") : `${base}${m[1].replace(/&amp;/g, "&")}`,
      location: clean(m[4]),
      postedAt: null,
    });
  }
  return rows;
}

async function fetchTbeListings(board) {
  const [segment, org, cws] = String(board).split("/");
  if (!segment || !org || !cws) throw new Error(`tbe: board must be "<segment>/<ORG>/<cws>", got "${board}"`);
  const base = `https://phg.tbe.taleo.net/${segment}/ats/careers/v2`;
  const query = `org=${encodeURIComponent(org)}&cws=${encodeURIComponent(cws)}`;

  // Step 1: be issued the session the results page requires.
  const form = await fetch(`${base}/jobSearch?${query}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!form.ok) throw new Error(`${form.status} tbe ${org}`);
  const setCookie = typeof form.headers.getSetCookie === "function"
    ? form.headers.getSetCookie()
    : [form.headers.get("set-cookie")].filter(Boolean);
  const cookie = setCookie.map((c) => String(c).split(";")[0]).join("; ");
  if (!cookie) throw new Error(`tbe ${org}: no session cookie issued`);

  const seen = new Map();
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = page === 0
      ? `${base}/searchResults?${query}`
      : `${base}/searchResults?next&rowFrom=${page * PAGE}&${query}`;
    let html;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/html", cookie, referer: `${base}/jobSearch?${query}` },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`${res.status} tbe ${org} page ${page}`);
      html = await res.text();
    } catch (error) {
      // A later page failing must not discard the rows already read.
      if (page === 0) throw error;
      break;
    }
    const rows = parseRows(html, `https://phg.tbe.taleo.net`);
    const before = seen.size;
    for (const row of rows) if (!seen.has(row.url)) seen.set(row.url, row);
    if (rows.length < PAGE || seen.size === before) break; // last page, or the pager is not moving
  }
  return [...seen.values()];
}

module.exports = { fetchTbeListings, parseRows, clean };

// SAP SuccessFactors career sites (jobs2web.com tenants).
//
// These are server-rendered, so unlike Avature they are readable from a plain
// Node fetch — no browser needed. The result list is a plain table:
//
//   <tr class="data-row">
//     <td class="colTitle"> … <a class="jobTitle-link" href="/ey/job/…/123/">Title</a>
//     <td class="colLocation"> <span class="jobLocation"> Lisbon, Lisbon, PT, 1349-066
//
// Locations arrive as "City, Region, CC, postcode" with an ISO COUNTRY CODE,
// and that shape defeats the shared isUsLocation() helper — badly. "Noida, UP,
// IN, 201301" contains ", IN," and IN is Indiana, so an unfiltered EY pull
// reported 286 "US" roles that were mostly Indian. ID is Indonesia and Idaho,
// AR is Argentina and Arkansas, DE is Germany and Delaware.
//
// A position-aware test is the only safe one here, and it belongs in this
// adapter because only this adapter knows the format: the country is the last
// segment once a trailing postcode is dropped. Callers use isUsJobs2Web()
// rather than the generic usOnly().

const PAGE = 25; // SuccessFactors' fixed page size; `startrow` walks it
const MAX = 200;

function decode(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&hellip;/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// One <tr class="data-row"> at a time. Written against the markup rather than a
// DOM parser to avoid pulling a dependency into a serverless function.
function parseRows(html, origin) {
  const out = [];
  const rows = html.split(/<tr[^>]*class="[^"]*data-row[^"]*"/i).slice(1);
  for (const row of rows) {
    const link = row.match(/<a[^>]+href="([^"]+)"[^>]*class="jobTitle-link"|<a[^>]+class="jobTitle-link"[^>]+href="([^"]+)"/i);
    const href = link && (link[1] || link[2]);
    if (!href) continue;
    const titleMatch = row.match(/class="jobTitle-link"[^>]*>([\s\S]*?)<\/a>/i);
    const title = decode(titleMatch && titleMatch[1]);
    if (!title) continue;
    const locMatch = row.match(/<span[^>]*class="jobLocation"[^>]*>([\s\S]*?)<\/span>/i);
    out.push({
      title,
      url: href.startsWith("http") ? href : `${origin}${href}`,
      location: decode(locMatch && locMatch[1]),
      postedAt: null,
    });
  }
  return out;
}

async function fetchJobs2WebListings(origin, terms) {
  const seen = new Map();

  for (const term of terms) {
    for (let startrow = 0; startrow < MAX; startrow += PAGE) {
      let html;
      try {
        const url = new URL("/search/", origin);
        url.searchParams.set("q", term);
        if (startrow) url.searchParams.set("startrow", String(startrow));
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
            Accept: "text/html",
          },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} jobs2web ${origin}`);
        html = await res.text();
      } catch (error) {
        // A first-page failure is a real fault worth reporting to source-health;
        // a later page failing should not discard what we already collected.
        if (startrow === 0) throw error;
        break;
      }

      const rows = parseRows(html, origin);
      for (const row of rows) {
        if (!seen.has(row.url)) seen.set(row.url, row);
      }
      if (rows.length < PAGE) break;
    }
  }

  return [...seen.values()];
}

// "Spring, TX, US, 77389" -> "US";  "Noida, UP, IN, 201301" -> "IN".
// A trailing postcode is any final segment containing a digit.
function countryOf(location) {
  const parts = String(location || "").split(",").map((p) => p.trim()).filter(Boolean);
  while (parts.length && /\d/.test(parts[parts.length - 1])) parts.pop();
  return parts.length ? parts[parts.length - 1].toUpperCase() : "";
}

// Positive US test for this format only. Requires the country position to
// actually say US — an unrecognised or missing country is dropped rather than
// guessed, which is the same precision-over-recall stance us-location.js takes.
function isUsJobs2Web(location) {
  const country = countryOf(location);
  return country === "US" || country === "USA" || country === "UNITED STATES"
    || country === "UNITED STATES OF AMERICA";
}

function usJobs2WebOnly(records) {
  return (Array.isArray(records) ? records : []).filter((r) => isUsJobs2Web(r.location));
}

module.exports = { fetchJobs2WebListings, parseRows, countryOf, isUsJobs2Web, usJobs2WebOnly };

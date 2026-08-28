// Oracle Taleo career sections — {tenant}.taleo.net/careersection/{section}/
//
// Taleo has a REST job-board endpoint, but on the sections checked it answers
// {"careerSectionUnAvailable": true} unless you supply the right internal
// portal id, which is not published anywhere on the page. The search page
// itself is JS-rendered and contains no job anchors.
//
// The listings are, however, already in the delivered HTML: Taleo serialises
// the whole result set into a hidden <input id="initialHistory"> as one long
// "!|!"-delimited string. One record looks like
//
//   30720!|!Auditor (OIG)!|!30720!|!Auditor (OIG)!|!30720!|!R025807!|!
//   DC-Washington!|!false!|!!|!!|!!|!!|!Aug 28, 2026!|!Apply!|!…
//
// i.e. the internal id and title repeat three times, then the requisition
// number, the location, a flag, four empty fields, and the employer's own
// posting date. Anchoring on that repetition is what makes the parse safe —
// matching "some digits then some text" alone would pick up unrelated pairs.
//
// Used by public-sector employers (the Federal Reserve Board among them) that
// no other adapter here can read.

// The repeated id/title triple is the anchor; \1 and \2 are back-references.
const RECORD = /(\d{3,8})!\|!([^!]{2,160}?)!\|!\1!\|!\2!\|!\1!\|!(R?\d[\w-]*)!\|!([^!]*)!\|![^!]*!\|!(?:[^!]*!\|!){4}([^!]*)!\|!/g;

const PAGE_PARAM = "rlPager.currentPage";
const REQUEST_TIMEOUT_MS = 20000;

// Taleo double-encodes: HTML entities on the way into the attribute, then
// percent-escapes inside the value itself ("%26" for &, "%5C" for a colon's
// escape). Undo both, and never let a bad escape throw.
function decode(value) {
  let out = String(value || "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  try {
    out = decodeURIComponent(out.replace(/%(?![0-9a-f]{2})/gi, "%25"));
  } catch {
    // keep the partially decoded string rather than losing the record
  }
  return out.replace(/\\/g, "").replace(/\s+/g, " ").trim();
}

function extractBlob(html) {
  const match = html.match(/id="initialHistory"[^>]*value="([\s\S]*?)"\s*\/?>/);
  return match ? match[1] : "";
}

// "Aug 28, 2026" -> ISO. Returns null rather than guessing on an unknown shape,
// so a locale we haven't seen degrades to "no date" instead of a wrong month.
function toIso(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const time = Date.parse(text);
  if (!Number.isFinite(time)) return null;
  const year = new Date(time).getUTCFullYear();
  if (year < 2015 || year > new Date().getUTCFullYear() + 1) return null;
  return new Date(time).toISOString();
}

function parsePage(html, tenant, section) {
  const blob = extractBlob(html);
  if (!blob) return [];
  const rows = [];
  RECORD.lastIndex = 0;
  let match;
  while ((match = RECORD.exec(blob))) {
    const [, , rawTitle, requisition, rawLocation, rawDate] = match;
    const title = decode(rawTitle);
    if (!title) continue;
    rows.push({
      title,
      url: `https://${tenant}.taleo.net/careersection/${section}/jobdetail.ftl?job=${encodeURIComponent(requisition)}`,
      location: decode(rawLocation),
      postedAt: toIso(rawDate),
    });
  }
  return rows;
}

// Pages are deduped by requisition URL and the walk stops as soon as a page
// contributes nothing new. That is deliberate: if a career section ignores the
// pager parameter it just re-serves page one, and without this the loop would
// spin re-reading the same jobs.
async function fetchTaleoListings(tenant, section = "1", maxPages = 8) {
  const seen = new Map();
  for (let page = 1; page <= maxPages; page += 1) {
    const url = `https://${tenant}.taleo.net/careersection/${section}/moresearch.ftl`
      + `?lang=en&${PAGE_PARAM}=${page}`;
    let html;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", Accept: "text/html" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) break;
      html = await res.text();
    } catch {
      break;
    }
    const rows = parsePage(html, tenant, section);
    if (!rows.length) break;
    const before = seen.size;
    for (const row of rows) if (!seen.has(row.url)) seen.set(row.url, row);
    if (seen.size === before) break; // page added nothing — pager not honoured
  }
  return [...seen.values()];
}

module.exports = { fetchTaleoListings, parsePage, decode, toIso, RECORD };

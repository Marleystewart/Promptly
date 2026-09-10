// Reusable IBM/Infinite BrassRing ("TalentGateway") adapter.
//
// BrassRing's search results are rendered by an Ajax route that answers only
// browsers, but the platform ALSO embeds the very same job objects into the
// server-rendered HTML of its own PageType=searchResults page as HTML-escaped
// JSON. We read that — the page BrassRing publicly serves — rather than
// imitating a browser against a route that refuses non-browser clients.
//
// Each job carries a Questions array of {QuestionName, Value} pairs:
//   jobtitle     -> title
//   formtext23   -> location ("United States - New York")
//   lastupdated  -> "09-Sep-2026"
// plus a Link to the public JobDetails page.

const { parsePostedAt } = require("./avature");
const { isUsLocation } = require("./us-location");

function unescapeHtml(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&");
}

// Pull the first balanced [...] following a marker, so nested objects survive.
function balancedArray(text, marker) {
  const at = text.indexOf(marker);
  if (at < 0) return null;
  const start = text.indexOf("[", at + marker.length - 1);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    if (text[i] === "[") depth += 1;
    else if (text[i] === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

// Tenants disagree about which custom field holds the location: UBS puts the
// whole thing in formtext23 ("United States - New York"), Edward Jones splits
// it across formtext61 (city) and formtext42 (state). So prefer the known
// field, else assemble from the custom fields, putting the one that reads as a
// US state last so it comes out as "Land O'Lakes, Florida".
function locationFrom(fields) {
  const clean = (v) => unescapeHtml(String(v || "")).replace(/\s+/g, " ").trim();
  const direct = clean(fields.formtext23);
  if (direct) return direct;
  const values = Object.keys(fields)
    .filter((k) => /^formtext\d+$/.test(k))
    .map((k) => clean(fields[k]))
    .filter((v) => v && v.length <= 40);
  if (!values.length) return "";
  const state = values.find((v) => isUsLocation(v));
  if (!state) return values.join(", ");
  return [...values.filter((v) => v !== state), state].join(", ");
}

async function fetchOneSite(host, partnerId, siteId) {
  const url = `https://${host}/TGnewUI/Search/home/HomeWithPreLoad`
    + `?partnerid=${encodeURIComponent(partnerId)}&siteid=${encodeURIComponent(siteId)}&PageType=searchResults`;
  let html;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", accept: "text/html" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  const raw = balancedArray(unescapeHtml(html), '"Job":[');
  if (!raw) return [];
  let jobs;
  try { jobs = JSON.parse(raw); } catch { return []; }

  const out = [];
  for (const job of Array.isArray(jobs) ? jobs : []) {
    const fields = {};
    for (const q of job.Questions || []) fields[q.QuestionName] = q.Value;
    const title = unescapeHtml(String(fields.jobtitle || "")).replace(/\s+/g, " ").trim();
    const url2 = String(job.Link || "").trim();
    if (!title || !url2) continue;
    out.push({
      title,
      url: url2,
      location: locationFrom(fields),
      postedAt: parsePostedAt(fields.lastupdated),
    });
  }
  return out;
}

// siteIds: the boards to read (a graduate board and, optionally, the general
// one — detectCycle still decides what counts as a student role).
async function fetchBrassringListings(host, partnerId, siteIds) {
  const seen = new Map();
  for (const siteId of siteIds) {
    for (const job of await fetchOneSite(host, partnerId, siteId)) {
      if (!seen.has(job.url)) seen.set(job.url, job);
    }
  }
  return [...seen.values()];
}

module.exports = { fetchBrassringListings };

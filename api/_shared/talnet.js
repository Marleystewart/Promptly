// Reusable Talentlink / tal.net careers-board adapter.
//
// tal.net publishes each job board as a real Atom feed
// (…/candidate/jobboard/vacancy/<n>/feed) — a machine-readable endpoint the
// platform provides on purpose, so no private API or browser is needed.
//
// Location: tal.net entries carry no location field; the city is written into
// the title ("… Summer Analyst Program – Chicago FIG"). We resolve that
// against geo.js's real US city table rather than guessing, so a US city
// becomes "Chicago, IL, United States" and anything we cannot positively
// confirm (Toronto, London) resolves to "" and is dropped by usOnly().

const geo = require("../../geo.js");

function titleCaseCity(city) {
  return city.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

// Longest city name first so "new york" wins over a stray shorter match.
const CITY_INDEX = Object.keys(geo.CITIES || {})
  .map((key) => {
    const [city, state] = key.split(",").map((s) => s.trim());
    return { city, label: `${titleCaseCity(city)}, ${String(state).toUpperCase()}, United States` };
  })
  .filter((e) => e.city && e.city.length > 3)
  .sort((a, b) => b.city.length - a.city.length);

function locationFromTitle(title) {
  const low = String(title || "").toLowerCase();
  for (const entry of CITY_INDEX) {
    if (low.includes(entry.city)) return entry.label;
  }
  return "";
}

function decode(s) {
  return String(s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

async function fetchTalnetListings(feedUrl) {
  let xml;
  try {
    const res = await fetch(feedUrl, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", accept: "application/atom+xml, application/xml" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`${res.status} talnet`);
    xml = await res.text();
  } catch {
    return [];
  }

  const out = [];
  const seen = new Set();
  for (const match of xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/g)) {
    const entry = match[1];
    const title = decode((entry.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1]);
    const href = (entry.match(/<link[^>]*href="([^"]+)"/) || [])[1] || "";
    if (!title || !href || seen.has(href)) continue;
    seen.add(href);
    const published = (entry.match(/<published[^>]*>([^<]+)<\/published>/) || [])[1] || null;
    out.push({
      title,
      url: href.replace(/\?instant=apply$/, ""),
      location: locationFromTitle(title),
      postedAt: published && Number.isFinite(Date.parse(published)) ? new Date(published).toISOString() : null,
    });
  }
  return out;
}

module.exports = { fetchTalnetListings, locationFromTitle };

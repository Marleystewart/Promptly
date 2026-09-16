// iCIMS career portals — <portal>.icims.com/jobs/search.
//
// Many employers show a Jibe front-end over iCIMS (see jibe.js), but plenty
// link straight to the iCIMS portal, and some keep their STUDENT or US jobs on
// a separate portal the Jibe site never lists (ECG's studentcareers-ecgmc,
// RTI's uscareers-rtiinc). The portal's search page server-renders its
// results when asked with in_iframe=1 — no browser, no token:
//
//   <li class="iCIMS_JobCardItem"> … <span> US-VA-Herndon | US-MD-Silver Spring</span>
//     … <span title="9/9/2026 9:54 AM"> …
//     <a href="…/jobs/170320/summer-2027-data-science-intern/job?in_iframe=1"
//        class="iCIMS_Anchor" title="170320 - Summer 2027 Data Science Intern">
//
// Locations are "<country>-<region>-<city>" with a two-letter COUNTRY code
// first. That order is a trap for text tests: rewriting "CA-ON-Toronto" as
// "Toronto, ON, CA" reads as California to a state-code matcher. So US-ness is
// decided here, from the country position, and callers use usIcimsOnly().

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const DEFAULT_TERMS = ["intern", "internship", "graduate", "co-op"];

function decode(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// "US-VA-Herndon" -> { us: true, text: "Herndon, VA, United States" }.
// Anything not in the coded shape is kept verbatim and judged by the caller.
function parseLocation(part) {
  const text = decode(part);
  const coded = text.match(/^([A-Z]{2})-([A-Z0-9]{1,3})-(.+)$/);
  if (coded) {
    const [, country, region, city] = coded;
    return country === "US"
      ? { us: true, text: `${city.trim()}, ${region}, United States` }
      : { us: false, text: `${city.trim()}, ${region}, ${country}` };
  }
  const countryOnly = text.match(/^([A-Z]{2})-(.+)$/);
  if (countryOnly) {
    return { us: countryOnly[1] === "US", text: `${countryOnly[2].trim()}, ${countryOnly[1]}` };
  }
  if (/^(US|USA|United States(?: of America)?)$/i.test(text)) return { us: true, text: "United States" };
  return { us: null, text };
}

// "9/9/2026 9:54 AM" -> ISO, or null.
function toIso(raw) {
  const m = String(raw || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function parseCards(html) {
  const out = [];
  const cards = String(html).split(/<li[^>]*class="[^"]*iCIMS_JobCardItem[^"]*"/i).slice(1);
  for (const card of cards) {
    const anchor = card.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*iCIMS_Anchor[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) continue;
    const heading = anchor[2].match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const title = decode(heading ? heading[1] : anchor[2]);
    const url = decode(anchor[1]).replace(/[?&]in_iframe=1/, "").replace(/\?$/, "");
    if (!title || !/^https:\/\//i.test(url)) continue;
    // The location's screen-reader label varies by portal ("Job Locations",
    // "Location : Location"), so read the header-left block itself: its last
    // visible <span> is the location.
    const left = card.match(/class="[^"]*header left[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const spans = left ? [...left[1].matchAll(/<span(?![^>]*sr-only)[^>]*>([\s\S]*?)<\/span>/gi)] : [];
    let locText = spans.length ? decode(spans[spans.length - 1][1]) : "";
    // Other portals (Dewberry) move it into the additional-fields list instead,
    // as a <dt> labelled "…Location…" with the value in the following <dd>.
    if (!locText) {
      const field = card.match(/<dt[^>]*>(?:(?!<\/dt>)[\s\S])*Location(?:(?!<\/dt>)[\s\S])*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i);
      locText = field ? decode(field[1]) : "";
    }
    const parts = locText.split(/\s*\|\s*/).filter(Boolean).map(parseLocation);
    const usParts = parts.filter((p) => p.us === true);
    const posted = card.match(/class="[^"]*header right[^"]*"[\s\S]*?<span[^>]*title="([^"]+)"/i);
    out.push({
      title,
      url,
      // Show only the US offices when there are any; they are what a student can take.
      location: (usParts.length ? usParts : parts).map((p) => p.text).join("; "),
      postedAt: toIso(posted && posted[1]),
      // true: a US office is listed. false: coded offices, none US. null: the
      // portal writes locations in some other shape — left for usIcimsOnly().
      us: usParts.length ? true : (parts.some((p) => p.us === false) ? false : null),
    });
  }
  return out;
}

function pageCount(html) {
  const m = String(html).match(/Page\s+\d+\s+of\s+(\d+)/i);
  return m ? Number(m[1]) : 1;
}

async function fetchIcimsListings(portalOrigin, { terms = DEFAULT_TERMS, maxPages = 4 } = {}) {
  const seen = new Map();
  for (const term of terms) {
    for (let pr = 0; pr < maxPages; pr += 1) {
      let html;
      try {
        const url = new URL("/jobs/search", portalOrigin);
        url.searchParams.set("ss", "1");
        url.searchParams.set("searchKeyword", term);
        url.searchParams.set("in_iframe", "1");
        if (pr) url.searchParams.set("pr", String(pr));
        const res = await fetch(url, {
          headers: { "User-Agent": UA, Accept: "text/html" },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} icims ${portalOrigin}`);
        html = await res.text();
      } catch (error) {
        if (!seen.size && term === terms[0] && pr === 0) throw error; // portal down: report it
        break;
      }
      const cards = parseCards(html);
      for (const card of cards) if (!seen.has(card.url)) seen.set(card.url, card);
      if (!cards.length || pr + 1 >= pageCount(html)) break;
    }
  }
  return [...seen.values()];
}

// Keep a card only with affirmative US evidence: a US-coded office, or — for
// portals that write plain text — a location the shared positive test accepts.
function usIcimsOnly(listings) {
  const { isUsLocation } = require("./us-location");
  return listings
    .filter((l) => l.us === true || (l.us === null && isUsLocation(l.location)))
    .map(({ us: _us, ...listing }) => listing);
}

module.exports = { fetchIcimsListings, usIcimsOnly, parseCards, parseLocation, toIso, pageCount };

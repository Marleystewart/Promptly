// Cornerstone OnDemand career sites — <corp>.csod.com/ux/ats/careersite/<id>.
//
// The career site page is a thin shell: it embeds csod.context, which carries
// the API host ("https://us.api.csod.com/") and a short-lived GUEST token
// issued to every anonymous visitor (user -5006). The page then POSTs its
// search to rec-job-search/external/jobs with that token. This reader does
// exactly what the page does, in the same order, with the honest user agent:
// no login, no challenge, nothing a visitor is not already handed.
//
// Locations are structured ({ city, state, country: "US" }), so US-ness is
// exact. Job pages: <origin>/ux/ats/careersite/<id>/home/requisition/<req>?c=<corp>.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const PAGE_SIZE = 50;
const MAX_PAGES = 6;

async function guestSession(corp, siteId) {
  const origin = `https://${corp}.csod.com`;
  const res = await fetch(`${origin}/ux/ats/careersite/${siteId}/home?c=${encodeURIComponent(corp)}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${res.status} csod ${corp}`);
  const html = await res.text();
  const token = (html.match(/"token"\s*:\s*"([^"]+)"/) || [])[1];
  const cloud = (html.match(/"cloud"\s*:\s*"([^"]+)"/) || [])[1] || "https://us.api.csod.com/";
  if (!token) throw new Error(`csod ${corp}: no guest token on the career site page`);
  return { origin, token, cloud: cloud.replace(/\/?$/, "/") };
}

function toListing(req, { origin }, corp, siteId) {
  const title = String(req.displayJobTitle || req.jobTitle || "").replace(/\s+/g, " ").trim();
  if (!title || req.requisitionId == null) return null;
  const places = Array.isArray(req.locations) ? req.locations : [];
  const usPlaces = places.filter((p) => String(p.country || "").toUpperCase() === "US");
  const label = (p) => [p.city, p.state, p.country === "US" ? "United States" : p.country].filter(Boolean).join(", ");
  return {
    title,
    url: `${origin}/ux/ats/careersite/${siteId}/home/requisition/${encodeURIComponent(req.requisitionId)}?c=${encodeURIComponent(corp)}`,
    location: (usPlaces.length ? usPlaces : places).map(label).filter(Boolean).join("; "),
    postedAt: req.postingEffectiveDate || null,
    us: usPlaces.length > 0,
  };
}

async function fetchCsodListings(corp, siteId) {
  const session = await guestSession(corp, siteId);
  const seen = new Map();
  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
    const res = await fetch(`${session.cloud}rec-job-search/external/jobs`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
      body: JSON.stringify({
        careerSiteId: Number(siteId), careerSitePageId: Number(siteId), pageNumber, pageSize: PAGE_SIZE,
        cultureId: 1, searchText: "", cultureName: "en-US", states: [], countryCodes: [], cities: [],
        placeID: "", radius: null, postingsWithinDays: null,
        customFieldCheckboxKeys: [], customFieldDropdowns: [], customFieldRadios: [],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (pageNumber === 1) throw new Error(`${res.status} csod search ${corp}`);
      break;
    }
    const body = await res.json();
    const data = body.data || body;
    const reqs = Array.isArray(data.requisitions) ? data.requisitions : [];
    for (const req of reqs) {
      const listing = toListing(req, session, corp, siteId);
      if (listing && !seen.has(listing.url)) seen.set(listing.url, listing);
    }
    if (reqs.length < PAGE_SIZE || pageNumber * PAGE_SIZE >= (Number(data.totalCount) || 0)) break;
  }
  return [...seen.values()];
}

function usCsodOnly(listings) {
  return listings.filter((l) => l.us).map(({ us: _us, ...l }) => l);
}

module.exports = { fetchCsodListings, usCsodOnly, toListing };

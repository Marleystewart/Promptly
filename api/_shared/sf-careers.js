// SAP SuccessFactors Career Site Builder — the NEWER SuccessFactors sites.
//
// jobs2web.js reads the older template, which server-renders a <tr class=
// "data-row"> table. Sites on the newer template (Wipro, HCLTech, OPEN Health)
// return a page with no rows at all, which reads as "no jobs". The page fills
// its list from POST <origin>/services/recruiting/v1/jobs, a JSON route that
// answers a plain server fetch — no token, no cookie.
//
// Two things vary by tenant and are the whole reason this is a module:
//
//   Country lives in different fields. Wipro fills jobLocationCountry
//   ("United States"); HCLTech uses a custom custCountryRegion; OPEN Health has
//   only a three-letter code inside jobLocationShort ("USA, "). countryOf()
//   reads whichever is present and never guesses from a state-shaped token.
//
//   The route honours facetFilters, so a tenant's own country field can be
//   applied server-side ({ jobLocationCountry: ["United States"] }). On Wipro
//   that is 133 reqs instead of 5,502 — the difference between one page per
//   term and forty.
//
// Job pages are <origin>/job/<urlTitle>/<id>-en_US (verified to resolve).

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const PAGE_SIZE = 10; // fixed by the route
const DEFAULT_TERMS = ["intern", "internship", "graduate", "university"];

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function shortParts(record) {
  return String(first(record.jobLocationShort) || "")
    .replace(/<br\s*\/?>/gi, "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

// Three-letter code in jobLocationShort: "Mountain View, USA-CA, USA, 94043".
function iso3Of(record) {
  return shortParts(record).find((part) => /^[A-Z]{3}$/.test(part)) || "";
}

function countryOf(record) {
  const named = first(record.jobLocationCountry) || first(record.custCountryRegion);
  if (named) return String(named).trim();
  const iso3 = iso3Of(record);
  return iso3 === "USA" ? "United States" : iso3;
}

function isUsRecord(record) {
  return /^(united states(?: of america)?|usa|us)$/i.test(countryOf(record));
}

// "Mountain View, USA-CA, USA, 94043" -> "Mountain View, CA, United States".
function locationOf(record) {
  const country = countryOf(record);
  const parts = shortParts(record);
  const city = parts.find((part) => !/^[A-Z]{3}(?:-[A-Z0-9]+)?$/.test(part) && !/\d/.test(part))
    || first(record.sfstd_jobLocation_obj) || record.custprimecity || "";
  const regionCode = (parts.find((part) => /^[A-Z]{3}-[A-Z0-9]+$/.test(part)) || "").split("-")[1] || "";
  const cleanCity = /^others?$/i.test(String(city)) ? "" : String(city).trim();
  return [cleanCity, regionCode, country].filter(Boolean).join(", ");
}

// "9/11/26" (M/D/YY) -> ISO. Null on anything else rather than a wrong month.
function postedAtOf(record) {
  const m = String(record.unifiedStandardStart || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (!m) return null;
  const date = new Date(Date.UTC(2000 + Number(m[3]), Number(m[1]) - 1, Number(m[2])));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function toListing(origin, record) {
  const title = String(record.unifiedStandardTitle || "").replace(/\s+/g, " ").trim();
  const urlTitle = record.urlTitle || record.unifiedUrlTitle;
  if (!title || !record.id || !urlTitle) return null;
  return {
    title,
    url: `${origin}/job/${String(urlTitle).replace(/&amp;/g, "%26")}/${encodeURIComponent(record.id)}-en_US`,
    location: locationOf(record),
    postedAt: postedAtOf(record),
    us: isUsRecord(record),
  };
}

async function fetchSfCareersListings(origin, { terms = DEFAULT_TERMS, facetFilters = {}, maxPages = 5 } = {}) {
  const seen = new Map();
  for (const keywords of terms) {
    for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
      let data;
      try {
        const res = await fetch(`${origin}/services/recruiting/v1/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": UA },
          body: JSON.stringify({
            locale: "en_US", pageNumber, sortBy: "", keywords, location: "",
            facetFilters, brand: "", skills: [], categoryId: 0, alertId: "", rcmCandidateId: "",
          }),
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} sf-careers ${origin}`);
        data = await res.json();
      } catch (error) {
        if (!seen.size && keywords === terms[0] && pageNumber === 0) throw error; // site down: report it
        break;
      }
      const results = Array.isArray(data.jobSearchResult) ? data.jobSearchResult : [];
      for (const hit of results) {
        const listing = toListing(origin, hit.response || hit);
        if (listing && !seen.has(listing.url)) seen.set(listing.url, listing);
      }
      const total = Number(data.totalJobs) || 0;
      if (results.length < PAGE_SIZE || (pageNumber + 1) * PAGE_SIZE >= total) break;
    }
  }
  return [...seen.values()];
}

// Keep records whose own country field says US. Precision over recall: a
// record with no country at all is dropped, same stance as us-location.js.
function usSfCareersOnly(listings) {
  return listings.filter((listing) => listing.us).map(({ us: _us, ...listing }) => listing);
}

module.exports = { fetchSfCareersListings, usSfCareersOnly, countryOf, locationOf, postedAtOf, toListing };

// Goldman Sachs publishes its campus roles on its own Next.js careers site,
// higher.gs.com. The marketing pages render nothing useful, but the site is an
// Apollo GraphQL client that reads a public, unauthenticated endpoint —
// api-higher.gs.com/gateway/api/v1/graphql — with a GetCampusRoles operation.
// We call that feed directly rather than parsing the client-rendered HTML.
//
// Endpoint + query + input shape were recovered from the site's own JS bundle
// (chunks/318-*.js): experiences ["CAMPUS"] is the students/interns tab; the
// experienced-hire tabs use ["EARLY_CAREER","PROFESSIONAL"], which we skip.
//
// jobTitle arrives as a pipe-delimited composite,
//   "2027 | Americas | Dallas Metro Area | Internal Audit | Summer Analyst"
// so we rebuild a clean "<year> <division> — <program>" title and rely on the
// structured locations array for the US/international gate in aggregator.js.

const ENDPOINT = "https://api-higher.gs.com/gateway/api/v1/graphql";
const ROLE_URL = "https://higher.gs.com/roles"; // /roles/<roleId> is the live posting
const PAGE_SIZE = 100;
const MAX_PAGES = 8; // safety cap (≈800 roles; the campus feed is a few hundred)

const QUERY = `query GetCampusRoles($searchQueryInput: RoleSearchQueryInput!) {
  roleSearch(searchQueryInput: $searchQueryInput) {
    totalCount
    items {
      roleId
      jobTitle
      division
      locations { primary state country city }
    }
  }
}`;

async function fetchPage(pageNumber) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: "https://higher.gs.com",
      Referer: "https://higher.gs.com/",
      "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
    },
    body: JSON.stringify({
      operationName: "GetCampusRoles",
      query: QUERY,
      variables: {
        searchQueryInput: {
          page: { pageSize: PAGE_SIZE, pageNumber },
          filters: [],
          experiences: ["CAMPUS"],
          searchTerm: "",
        },
      },
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} goldmansachs`);
  const data = await res.json();
  const search = data?.data?.roleSearch;
  return {
    items: Array.isArray(search?.items) ? search.items : [],
    total: Number(search?.totalCount) || 0,
  };
}

// One location object -> "City, ST, Country". A role can list several offices,
// which we join with "; " so aggregator.js keeps it if ANY office is US and
// drops the foreign parts for display.
function formatLocations(locations) {
  return (Array.isArray(locations) ? locations : [])
    .map((l) => [l.city, l.state, l.country].filter(Boolean).join(", "))
    .filter(Boolean)
    .join("; ");
}

// "2027 | Americas | Dallas Metro Area | Internal Audit | Summer Analyst"
// -> "2027 Internal Audit — Summer Analyst". Falls back to the raw composite
// (minus the region/city segments) if it isn't the expected 5-part shape.
function cleanTitle(jobTitle, division) {
  const parts = String(jobTitle || "").split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 5) {
    const [year, , , department, program] = parts;
    return `${year} ${division || department} — ${program}`.replace(/\s+/g, " ").trim();
  }
  return String(jobTitle || "").replace(/\s+/g, " ").trim();
}

async function fetchListings() {
  const seen = new Map();
  for (let page = 0; page < MAX_PAGES; page += 1) {
    let result;
    try {
      result = await fetchPage(page);
    } catch {
      break; // a failed page shouldn't abandon the whole source
    }
    for (const item of result.items) {
      // roleSearch returns roleId as "<number>_GS_CAMPUS", but the public
      // posting page is /roles/<number> — the suffix 404s. Take the numeric id.
      const numericId = String(item.roleId || "").split("_")[0].trim();
      if (!/^\d+$/.test(numericId)) continue;
      const title = cleanTitle(item.jobTitle, item.division);
      if (!title) continue;
      const url = `${ROLE_URL}/${numericId}`;
      seen.set(url, { title, url, location: formatLocations(item.locations) });
    }
    if (!result.items.length || (page + 1) * PAGE_SIZE >= result.total) break;
  }
  return [...seen.values()];
}

module.exports = fetchListings;

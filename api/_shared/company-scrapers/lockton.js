// Lockton — careers.lockton.com.
//
// The careers site is a Next.js shell: /browsejobs ships no jobs in its HTML,
// and lockton.taleo.net (the system of record) serves the same shell, so both
// the plain-HTML and the Taleo readers see an empty list. The page fills itself
// from an Algolia index using the search-only key it publishes to every visitor
// in its own bundle — the same shape as the guest tokens csod.js and paycom
// use. Nothing here is a login, a challenge, or a private key.
//
// `country` is a structured field ("United States of America"), so US-ness is
// exact rather than guessed from a city name. `location` reads "State, City",
// which is reversed below so the card shows "St. Louis, Missouri".
// Job pages: careers.lockton.com/jobid/<referenceID lowercased>.

const APP_ID = "97ERBYM9H9";
const SEARCH_KEY = "4be2c9d74503c09993ca5adeb254fb06";
const INDEX = "prod_contentful_job";
const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";

function place(hit) {
  const parts = Array.isArray(hit.location) ? hit.location : [];
  const labels = parts
    .map((p) => String(p).split(",").map((x) => x.trim()).filter(Boolean))
    .map(([state, city]) => (city ? `${city}, ${state}` : state))
    .filter(Boolean);
  return labels.length ? labels.join("; ") : String(hit.city || "").trim();
}

module.exports = async function fetchListings() {
  const res = await fetch(`https://${APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/${INDEX}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Algolia-API-Key": SEARCH_KEY,
      "X-Algolia-Application-Id": APP_ID,
      "User-Agent": UA,
    },
    body: JSON.stringify({ query: "", hitsPerPage: 1000, page: 0 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`${res.status} lockton algolia`);
  const data = await res.json();

  const out = [];
  for (const hit of Array.isArray(data.hits) ? data.hits : []) {
    // Structured country, so an unknown foreign office is dropped by default.
    if (!/united states/i.test(String(hit.country || ""))) continue;
    const ref = String(hit.referenceID || "").trim();
    const title = String(hit.jobTitle || "").replace(/\s+/g, " ").trim();
    if (!ref || !title) continue;
    out.push({
      title,
      url: `https://careers.lockton.com/jobid/${encodeURIComponent(ref.toLowerCase())}`,
      location: place(hit),
      postedAt: null,
    });
  }
  return out;
};

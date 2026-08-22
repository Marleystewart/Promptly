// PepsiCo's first-party jobs site is powered by Jibe.  Its public JSON endpoint
// exposes the same current postings and canonical job URLs shown in the UI.

const API_URL = "https://www.pepsicojobs.com/api/jobs";
const TERMS = ["intern", "internship", "2027", "graduate"];
const { usOnly } = require("../us-location");

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    const url = new URL(API_URL);
    url.searchParams.set("keywords", term);
    url.searchParams.set("limit", "100");

    let data;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`${res.status} pepsico`);
      data = await res.json();
    } catch {
      continue;
    }

    for (const record of Array.isArray(data.jobs) ? data.jobs : []) {
      const job = record?.data || {};
      if (job.searchable === false || job.applyable === false) continue;
      // Jibe gives us a structured ISO country code.  Use it before the text
      // fallback so "Tbilisi, Georgia" cannot be confused with the US state.
      const countryCode = String(job.country_code || "").toUpperCase();
      if (countryCode && countryCode !== "US") continue;
      const title = String(job.title || "").replace(/\s+/g, " ").trim();
      const slug = String(job.slug || job.req_id || "").trim();
      const canonical = String(job.meta_data?.canonical_url || "").trim();
      if (!title || (!canonical && !slug)) continue;

      const extras = Array.isArray(job.additional_locations)
        ? job.additional_locations.map((location) =>
          location?.full_location
          || [location?.city, location?.state, location?.country].filter(Boolean).join(", ")
        ).filter(Boolean)
        : [];
      const location = [
        job.full_location
          || [job.city, job.state, job.country].filter(Boolean).join(", "),
        ...extras,
      ].filter(Boolean).join("; ");
      const posting = {
        title,
        url: canonical || `https://www.pepsicojobs.com/jobs/${encodeURIComponent(slug)}?lang=en-us`,
        location,
      };
      seen.set(posting.url, posting);
    }
  }
  return usOnly([...seen.values()]);
}

module.exports = fetchListings;

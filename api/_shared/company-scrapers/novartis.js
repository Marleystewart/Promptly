// Novartis runs a first-party Workday tenant (novartis.wd3/Novartis_Careers).
// It would normally just be a { ats:"workday" } registry line, but Novartis is
// a global board and its Workday location text is sometimes a bare city with no
// country ("Selangor"), which slips past aggregator.js's international blocklist
// into this US-only feed. So we read the same Workday feed here and keep only
// positively-confirmed US roles. See api/_shared/us-location.js.

const TENANT = "novartis";
const DC = "wd3";
const SITE = "Novartis_Careers";
const BASE = `https://${TENANT}.${DC}.myworkdayjobs.com`;
const API = `${BASE}/wday/cxs/${TENANT}/${SITE}/jobs`;
const TERMS = ["intern", "student", "graduate", "university"];
const PAGE_SIZE = 20;
const MAX_PAGES = 5;

const { usOnly } = require("../us-location");

async function fetchPage(searchText, offset) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ appliedFacets: {}, limit: PAGE_SIZE, offset, searchText }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} novartis`);
  return res.json();
}

async function fetchListings() {
  const seen = new Map();
  for (const term of TERMS) {
    for (let page = 0; page < MAX_PAGES; page += 1) {
      let data;
      try {
        data = await fetchPage(term, page * PAGE_SIZE);
      } catch {
        break;
      }
      const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
      if (!postings.length) break;
      for (const p of postings) {
        if (!p.externalPath || seen.has(p.externalPath)) continue;
        seen.set(p.externalPath, {
          title: String(p.title || "").replace(/\s+/g, " ").trim(),
          url: `${BASE}/en-US/${SITE}${p.externalPath}`,
          location: String(p.locationsText || "").replace(/\s+/g, " ").trim(),
        });
      }
      if (postings.length < PAGE_SIZE) break;
    }
  }
  return usOnly([...seen.values()]);
}

module.exports = fetchListings;

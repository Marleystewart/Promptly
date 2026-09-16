// Amentum — Workday, on the tenant it inherited from PAE (pae.wd1, site
// Amentum_Careers; amentum.com links it). Locations are iCIMS-style country
// codes ("US-TX-Texarkana"), which positiveUsOnly cannot read and the board
// offers no Country facet, so this reads the cxs feed itself and decides
// US-ness from the country position with icims.js's parser.
const { parseLocation } = require("../icims");

const BASE = "https://pae.wd1.myworkdayjobs.com";
const API = `${BASE}/wday/cxs/pae/Amentum_Careers/jobs`;
const TERMS = ["intern", "new grad", "entry level", "university"];
const PAGES = 5;

module.exports = async function fetchListings() {
  const seen = new Map();
  for (const searchText of TERMS) {
    for (let page = 0; page < PAGES; page += 1) {
      let data;
      try {
        const res = await fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" },
          body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: page * 20, searchText }),
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} amentum`);
        data = await res.json();
      } catch (error) {
        if (!seen.size && searchText === TERMS[0] && page === 0) throw error;
        break;
      }
      const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
      for (const p of postings) {
        if (!p.externalPath || seen.has(p.externalPath)) continue;
        const place = parseLocation(p.locationsText || "");
        if (place.us !== true) continue; // "N Locations" and foreign codes are dropped, not guessed
        seen.set(p.externalPath, { title: p.title, url: `${BASE}/en-US/Amentum_Careers${p.externalPath}`, location: place.text, postedAt: null });
      }
      if (postings.length < 20) break;
    }
  }
  return [...seen.values()];
};

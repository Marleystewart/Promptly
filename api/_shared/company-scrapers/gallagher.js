const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// Gallagher (Buck included since 2023) — Jibe over iCIMS (jobs.ajg.com). Global, US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://jobs.ajg.com", ["intern", "internship", "graduate", "university"]));
};

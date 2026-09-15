const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// ZS Associates — Jibe front-end over iCIMS (jobs.zs.com). Global firm, US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://jobs.zs.com", ["intern", "internship", "graduate", "university"]));
};

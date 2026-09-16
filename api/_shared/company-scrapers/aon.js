const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// Aon — Jibe front-end over iCIMS (jobs.aon.com). Global board (Canada, Indonesia…), US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://jobs.aon.com", ["intern", "internship", "graduate", "university"]));
};

const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// CDM Smith — Jibe front-end over iCIMS (careers.cdmsmith.com).
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.cdmsmith.com", ["intern", "internship", "graduate", "university"]));
};

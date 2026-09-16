const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// TRC Companies — Jibe front-end over iCIMS (careers.trccompanies.com).
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.trccompanies.com", ["intern", "internship", "graduate", "university"]));
};

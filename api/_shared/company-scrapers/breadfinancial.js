const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// Bread Financial — Phenom (careers.breadfinancial.com, CNAME breadfinancial.phenompeople.net).
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.breadfinancial.com", ["intern", "internship", "university", "graduate"]));
};

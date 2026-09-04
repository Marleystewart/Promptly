const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// Humana — Phenom (careers.humana.com, CNAME humana.phenompeople.net).
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.humana.com", ["intern", "internship", "university", "graduate"]));
};

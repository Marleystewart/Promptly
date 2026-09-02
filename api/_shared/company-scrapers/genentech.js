const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// Genentech — Phenom (careers.gene.com, CNAME genentech.phenompeople.com).
// Roche's US arm; kept as its own card because students search the US brand.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.gene.com", ["intern", "internship", "university", "graduate"]));
};

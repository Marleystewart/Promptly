const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// Crowe — Phenom (careers.crowe.com). The search page does not server-render its
// results, so this reads the /widgets feed the page itself calls.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.crowe.com", ["intern", "internship", "graduate", "university"]));
};

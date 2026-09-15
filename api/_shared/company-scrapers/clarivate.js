const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// Clarivate — Phenom (careers.clarivate.com); /us/en 404s and the root page renders nothing, so read the /widgets feed. Global, US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.clarivate.com", ["intern", "internship", "graduate", "university"]));
};

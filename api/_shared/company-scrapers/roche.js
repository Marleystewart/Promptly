// Roche runs a Phenom career site (careers.roche.com) that loads its results
// from the /widgets POST feed rather than server-rendering them. Roche's board
// is overwhelmingly non-US (Shanghai, Basel, Dhaka…), and those foreign cities
// are not all on aggregator.js's international blocklist, so we filter to
// positively-confirmed US locations here rather than trusting the blocklist.
// See api/_shared/phenom.js › fetchPhenomWidgets and api/_shared/us-location.js.
const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");

module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.roche.com", ["intern", "graduate", "student", "2027"]));
};

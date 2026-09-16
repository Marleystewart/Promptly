const { fetchCsodListings, usCsodOnly } = require("../csod");
// Mathematica — Cornerstone OnDemand career site 4 (mathematica.csod.com),
// linked from careers.mathematica.org.
module.exports = async function fetchListings() {
  return usCsodOnly(await fetchCsodListings("mathematica", 4));
};

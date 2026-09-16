const { fetchCsodListings, usCsodOnly } = require("../csod");
// Simon-Kucher — Cornerstone OnDemand career site 6 (simon-kucher.csod.com),
// linked from simon-kucher.com/careers. Global firm; US offices only.
module.exports = async function fetchListings() {
  return usCsodOnly(await fetchCsodListings("simon-kucher", 6));
};

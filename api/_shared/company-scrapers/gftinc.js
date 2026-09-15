const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");
// Gannett Fleming TranSystems (GFT) — Phenom (careers.gftinc.com).
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://careers.gftinc.com", ["intern", "internship", "graduate", "university"]));
};

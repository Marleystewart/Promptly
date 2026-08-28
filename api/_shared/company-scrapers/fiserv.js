const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// Fiserv — Phenom careers site (careers.fiserv.com), global; keep US-only.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.fiserv.com", ["intern", "internship", "university", "graduate"]));
};

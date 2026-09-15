const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");
// HUB International — Phenom (careers.hubinternational.com). Has Canadian offices, US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://careers.hubinternational.com", ["intern", "internship", "graduate", "university"]));
};

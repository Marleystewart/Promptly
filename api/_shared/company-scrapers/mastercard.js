// Mastercard runs a Phenom career site (careers.mastercard.com) that loads
// results from /widgets. Global payments firm, so keep only confirmed-US roles.
const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.mastercard.com", ["intern", "internship", "university", "graduate"]));
};

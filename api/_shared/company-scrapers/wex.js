const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.wexinc.com", ["intern", "internship", "university", "graduate"]));
};

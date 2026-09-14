const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");
// BCG's careers site is Phenom. Global firm, so keep only confirmed-US roles.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://careers.bcg.com", ["intern", "internship", "summer", "2027"]));
};

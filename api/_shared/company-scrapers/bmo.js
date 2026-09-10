const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");

// BMO runs a Phenom career site that server-renders its results.
// Canadian bank, so keep only confirmed-US roles.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://jobs.bmo.com", ["intern", "internship", "summer", "2027"]));
};

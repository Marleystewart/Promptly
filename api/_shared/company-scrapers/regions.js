const { fetchPhenomListings } = require("../phenom");

// Regions' branded careers search server-renders its live Phenom result data,
// including the original Workday apply URLs.
module.exports = function fetchListings() {
  return fetchPhenomListings("https://careers.regions.com", ["intern", "2027"]);
};

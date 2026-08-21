const { fetchPhenomListings } = require("../phenom");

// Truist's branded careers search server-renders its live Phenom result data,
// including the original Workday apply URLs.
module.exports = function fetchListings() {
  return fetchPhenomListings("https://careers.truist.com", ["intern", "2027"]);
};

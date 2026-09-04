const { fetchPhenomListings } = require("../phenom");

// Bread Financial's careers site (careers.breadfinancial.com) is a Phenom
// People board that server-renders its live result data, including the real
// apply URLs. Same pattern as Regions/Truist.
module.exports = function fetchListings() {
  return fetchPhenomListings("https://careers.breadfinancial.com", ["intern", "2027"]);
};

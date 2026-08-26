const { fetchRadancyListings } = require("../radancy");
// MassMutual — Radancy careers site (careers.massmutual.com).
module.exports = function fetchListings() {
  return fetchRadancyListings("https://careers.massmutual.com", ["intern", "internship", "development program"]);
};

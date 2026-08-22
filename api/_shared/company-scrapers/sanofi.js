// Sanofi runs its careers site on Radancy (jobs.sanofi.com). Shared parse in
// api/_shared/radancy.js reads the server-rendered results, incl. full location.
const { fetchRadancyListings } = require("../radancy");

module.exports = function fetchListings() {
  return fetchRadancyListings("https://jobs.sanofi.com", ["intern", "internship", "graduate"]);
};

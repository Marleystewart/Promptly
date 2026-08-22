// The Walt Disney Company runs its careers site on Radancy
// (jobs.disneycareers.com). No JSON ATS feed, but the results HTML carries full
// "City, State, Country" locations — see api/_shared/radancy.js for the parse.
const { fetchRadancyListings } = require("../radancy");

module.exports = function fetchListings() {
  return fetchRadancyListings("https://jobs.disneycareers.com", ["intern", "internship", "graduate"]);
};

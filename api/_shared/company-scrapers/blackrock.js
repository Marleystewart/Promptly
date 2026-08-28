// BlackRock runs a Radancy careers site (careers.blackrock.com). Shared parse
// in api/_shared/radancy.js reads its server-rendered results (title + full
// "City, ST" location); aggregator.js keeps US roles and drops international.
const { fetchRadancyListings } = require("../radancy");

module.exports = function fetchListings() {
  return fetchRadancyListings("https://careers.blackrock.com", ["intern", "internship", "analyst program", "graduate"]);
};

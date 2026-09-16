const { fetchTaleoRestListings } = require("../taleo");
// Segal — Taleo REST job board, portal 8100016024 (linked from segalco.com).
// Every req says "Multiple Locations", so the section's own LOCATION facet does
// the US filtering: 100016024 is its only country node, "United States".
module.exports = function fetchListings() {
  return fetchTaleoRestListings("segalco", "segalextwqm1011", "8100016024", { locationIds: ["100016024"] });
};

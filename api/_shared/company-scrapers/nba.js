const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// NBA — Phenom (careers.nba.com, CNAME nba.phenompeople.net).
//
// Only the widgets endpoint works here. The server-rendered search page returns
// nothing for this tenant, so fetchPhenomListings finds zero and looks broken.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.nba.com", ["intern", "internship", "university", "graduate"]));
};

const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Perficient — Oracle Recruiting Cloud on their own domain (site CX_1).
//
// The board is small (about 150 reqs), and its keyword search is the reason
// this was filed as empty for so long: "internship" and a year both return 0,
// while "intern" fuzzily returns senior roles with "internal" in the title.
// An empty keyword returns the whole board, which is what we want — the title
// filter upstream decides what is a student role.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("careers.perficient.com", "CX_1", [""]));
};

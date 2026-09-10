const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");

// Cantor Fitzgerald runs Oracle Recruiting Cloud. Global firm, so US-only.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("hdow.fa.us6.oraclecloud.com", "CX_1003"));
};

const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");

// Chubb runs Oracle Recruiting Cloud. Global insurer, so US-only.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("fa-ewgu-saasfaprod1.fa.ocs.oraclecloud.com", "CX_2001"));
};

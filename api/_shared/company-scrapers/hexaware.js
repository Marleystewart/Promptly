const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Hexaware Technologies — mostly India/Mexico/Egypt, US-filtered — Oracle Recruiting Cloud (site CX_1), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("fa-etqo-saasfaprod1.fa.ocs.oraclecloud.com", "CX_1"));
};

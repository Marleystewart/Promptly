const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// EXL — mostly India, US-filtered — Oracle Recruiting Cloud (site CX_2), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("fa-ewjt-saasfaprod1.fa.ocs.oraclecloud.com", "CX_2"));
};

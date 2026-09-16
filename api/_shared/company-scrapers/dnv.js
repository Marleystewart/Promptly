const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// DNV — global (Norway, Germany, Canada…), so US-filtered — Oracle Recruiting Cloud (site CX_1), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("ecyq.fa.em2.oraclecloud.com", "CX_1"));
};

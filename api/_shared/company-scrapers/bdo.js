const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// BDO USA runs Oracle Recruiting Cloud (site CX_1001).
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("ebqb.fa.us2.oraclecloud.com", "CX_1001"));
};

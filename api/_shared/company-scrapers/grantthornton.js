const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Grant Thornton runs Oracle Recruiting Cloud (site CX_1).
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("ehzq.fa.us2.oraclecloud.com", "CX_1"));
};

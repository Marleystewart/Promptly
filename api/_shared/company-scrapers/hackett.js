const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// The Hackett Group — Oracle Recruiting Cloud (site CX_6), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("eeih.fa.us2.oraclecloud.com", "CX_6"));
};

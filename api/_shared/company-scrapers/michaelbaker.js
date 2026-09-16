const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Michael Baker International — Oracle Recruiting Cloud (site CX_2), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("ebxs.fa.us2.oraclecloud.com", "CX_2"));
};

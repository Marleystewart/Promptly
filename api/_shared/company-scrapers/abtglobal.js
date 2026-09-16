const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Abt Global — many overseas project posts (Fiji, Malawi…), US-filtered — Oracle Recruiting Cloud (site JoinAbt), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("egpy.fa.us2.oraclecloud.com", "JoinAbt"));
};

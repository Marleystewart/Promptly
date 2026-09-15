const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// APCO Worldwide — its careers page embeds Oracle Recruiting Cloud
// (fa-evxv-saasfaprod1, CX_1). Offices worldwide (Beijing, Paris…), US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("fa-evxv-saasfaprod1.fa.ocs.oraclecloud.com", "CX_1"));
};

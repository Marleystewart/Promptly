const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// SAIC — jobs.saic.com is a Talemetry front-end; each Apply opens Oracle
// Recruiting Cloud (eihu.fa.us8, site CX), which answers a plain fetch.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("eihu.fa.us8.oraclecloud.com", "CX"));
};

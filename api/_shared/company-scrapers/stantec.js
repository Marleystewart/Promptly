const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Stantec — stantec.jobs (a DirectEmployers front-end) hands every Apply off to
// Oracle Recruiting Cloud (hdhl.fa.us6, site CX_1). Canadian-headquartered, so US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("hdhl.fa.us6.oraclecloud.com", "CX_1"));
};

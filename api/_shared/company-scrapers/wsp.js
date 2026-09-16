const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// WSP — wsp.com/careers/job-opportunities lists reqs that link straight into
// Oracle Recruiting Cloud (emit.fa.ca3, site CX_2001). WSP is Canadian-headquartered
// and global (838 reqs on first read, 217 US), so it is US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("emit.fa.ca3.oraclecloud.com", "CX_2001"));
};

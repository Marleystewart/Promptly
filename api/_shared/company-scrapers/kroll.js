const { fetchOracleListings } = require("../oracle-cloud");
const { usOnly } = require("../us-location");
// Kroll — careers.kroll.com is a Sitecore front-end behind Cloudflare Turnstile,
// but every Apply button there opens Oracle Recruiting Cloud (hcxs.fa.us2, site
// CX_1), the ATS itself, which answers a plain fetch. Global, US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchOracleListings("hcxs.fa.us2.oraclecloud.com", "CX_1"));
};

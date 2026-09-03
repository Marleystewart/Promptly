const { fetchJobs2WebListings, usJobs2WebOnly } = require("../jobs2web");
// ExxonMobil — SAP SuccessFactors (jobs.exxonmobil.com, CNAME exxonmobil.jobs2web.com).
module.exports = async function fetchListings() {
  return usJobs2WebOnly(await fetchJobs2WebListings(
    "https://jobs.exxonmobil.com", ["intern", "internship", "graduate", "university"],
  ));
};

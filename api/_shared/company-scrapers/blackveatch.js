const { fetchJobs2WebListings, usJobs2WebOnly } = require("../jobs2web");
// Black & Veatch — SAP SuccessFactors, older server-rendered template (https://careers.bv.com).
module.exports = async function fetchListings() {
  return usJobs2WebOnly(await fetchJobs2WebListings("https://careers.bv.com", ["intern", "internship", "graduate", "university"]));
};

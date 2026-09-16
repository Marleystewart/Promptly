const { fetchJobs2WebListings, usJobs2WebOnly } = require("../jobs2web");
// Birlasoft — board is mostly India — SAP SuccessFactors, older server-rendered template (https://jobs.birlasoft.com).
module.exports = async function fetchListings() {
  return usJobs2WebOnly(await fetchJobs2WebListings("https://jobs.birlasoft.com", ["intern", "internship", "graduate", "university"]));
};

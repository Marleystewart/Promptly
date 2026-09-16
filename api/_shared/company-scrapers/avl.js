const { fetchJobs2WebListings, usJobs2WebOnly } = require("../jobs2web");
// AVL — Austrian; US office in Plymouth, MI — SAP SuccessFactors, older server-rendered template (https://jobs.avl.com).
module.exports = async function fetchListings() {
  return usJobs2WebOnly(await fetchJobs2WebListings("https://jobs.avl.com", ["intern", "internship", "graduate", "university"]));
};

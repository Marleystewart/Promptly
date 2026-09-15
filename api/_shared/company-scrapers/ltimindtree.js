const { fetchJobs2WebListings, usJobs2WebOnly } = require("../jobs2web");
// LTIMindtree — board is mostly India/Mexico/Japan — SAP SuccessFactors, older server-rendered template (https://careers.ltm.com).
module.exports = async function fetchListings() {
  return usJobs2WebOnly(await fetchJobs2WebListings("https://careers.ltm.com", ["intern", "internship", "graduate", "university"]));
};

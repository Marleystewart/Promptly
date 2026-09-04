const { fetchJobs2WebListings, usJobs2WebOnly } = require("../jobs2web");
// EY — SAP SuccessFactors (careers.ey.com, CNAME ey.jobs2web.com).
//
// usJobs2WebOnly, NOT the generic usOnly: EY's board is overwhelmingly Indian,
// and "Noida, UP, IN, 201301" reads as Indiana to a state-code matcher.
module.exports = async function fetchListings() {
  return usJobs2WebOnly(await fetchJobs2WebListings(
    "https://careers.ey.com", ["intern", "internship", "graduate", "university"],
  ));
};

const { fetchFindlyListings, usFindlyOnly } = require("../findly");
// Cleveland Clinic — Findly (jobs.clevelandclinic.org, CNAME
// clevelandcliniccareers.cdn.findly.com), on Findly's "google" backend.
module.exports = async function fetchListings() {
  return usFindlyOnly(await fetchFindlyListings(
    { backend: "google", companyUuid: "ed426cce-a5ac-48b0-ba13-35fa552c0bd9" },
    ["intern", "internship", "graduate", "university"],
  ));
};

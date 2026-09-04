const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// GSK — Phenom (jobs.gsk.com, CNAME gsk.phenompeople.net).
//
// usOnly matters more here than for most sources: GSK's board is heavily
// European, and an unfiltered pull returns Italian and UK internships that no
// US student can apply to.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://jobs.gsk.com", ["intern", "internship", "university", "graduate"]));
};

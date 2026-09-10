const { fetchBrassringListings } = require("../brassring");
const { usOnly } = require("../us-location");

// UBS runs BrassRing. 5131 is the graduate/student gateway; 5012 is the
// general one, kept because a US campus req sometimes lands there and
// detectCycle still gates what counts as a student role. Swiss bank, so the
// board is EMEA-heavy — keep only confirmed-US postings.
module.exports = async function fetchListings() {
  return usOnly(await fetchBrassringListings("jobs.ubs.com", "25008", ["5131", "5012"]));
};

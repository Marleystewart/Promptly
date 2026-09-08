const { fetchAvatureListings } = require("../avature");
const { usOnly } = require("../us-location");

// MetLife's careers site (metlifecareers.com) is an Avature tenant. Global
// insurer, so keep only confirmed-US roles.
module.exports = async function fetchListings() {
  return usOnly(await fetchAvatureListings("https://www.metlifecareers.com/en_US/ml/SearchJobs/"));
};

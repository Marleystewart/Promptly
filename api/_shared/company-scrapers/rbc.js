const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");

// RBC runs a Phenom career site that loads results from /widgets rather than
// server-rendering them. Canadian bank, so keep only confirmed-US roles.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://jobs.rbc.com", ["intern", "internship", "summer analyst", "2027"]));
};

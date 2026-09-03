const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");
// Ford — Eightfold (jobs.ford.com, CNAME ford.eightfold.ai).
module.exports = async function fetchListings() {
  return usOnly(await fetchEightfoldListings(
    "https://jobs.ford.com", "ford.com",
    ["intern", "internship", "university", "graduate"],
  ));
};

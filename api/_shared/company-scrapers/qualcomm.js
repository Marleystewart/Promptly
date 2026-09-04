const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");
// Qualcomm — Eightfold (careers.qualcomm.com, CNAME qualcomm.eightfold.ai).
//
// usOnly is doing real work here: Qualcomm's board is global, and the first
// page of "intern" is Colombia, Ireland and Brazil. Unfiltered, this would put
// roles no US student can take at the top of their feed.
module.exports = async function fetchListings() {
  return usOnly(await fetchEightfoldListings(
    "https://careers.qualcomm.com", "qualcomm.com",
    ["intern", "internship", "university", "graduate"],
  ));
};

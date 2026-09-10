// RTX (Raytheon) runs a Phenom career site (careers.rtx.com) that loads its
// results from /widgets rather than server-rendering them. Global defense firm,
// so keep only confirmed-US roles. Returns real Summer-2027 intern reqs.
const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.rtx.com", ["intern", "internship", "university", "graduate"]));
};

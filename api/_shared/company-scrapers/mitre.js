const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// MITRE — Phenom (careers.mitre.org). Its Workday site (mitre.wd5/MITRE) lists 0
// reqs publicly; the Phenom /widgets feed is what the careers page reads.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.mitre.org", ["intern", "internship", "graduate", "university"]));
};

const { fetchPhenomWidgets } = require("../phenom");
const { usOnly } = require("../us-location");
// FIS (Fidelity National Information Services) — Phenom (careers.fisglobal.com).
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomWidgets("https://careers.fisglobal.com", ["intern", "internship", "university", "graduate"]));
};

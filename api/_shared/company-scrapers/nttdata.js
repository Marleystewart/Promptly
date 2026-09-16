const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");
// NTT DATA — Phenom (careers.nttdata.com). Global site: it only answers /global/en, and its board is mostly non-US.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://careers.nttdata.com", ["intern", "internship"], "/global/en"));
};

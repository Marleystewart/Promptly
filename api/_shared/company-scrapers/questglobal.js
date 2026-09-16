const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");
// Quest Global — Phenom (careers.quest-global.com), /global/en only. Mostly non-US.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://careers.quest-global.com", ["intern", "internship"], "/global/en"));
};

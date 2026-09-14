const { fetchPhenomListings } = require("../phenom");
const { usOnly } = require("../us-location");
// ICF runs a Phenom careers site. Global consultancy, so keep US-only.
module.exports = async function fetchListings() {
  return usOnly(await fetchPhenomListings("https://careers.icf.com", ["intern", "internship", "summer", "2027"]));
};

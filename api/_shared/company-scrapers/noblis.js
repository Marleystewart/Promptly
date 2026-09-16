const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// Noblis — Jibe front-end over iCIMS (careers.noblis.org).
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.noblis.org", ["intern", "internship", "graduate", "university"]));
};

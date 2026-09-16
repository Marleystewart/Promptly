const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// ECG Management Consultants — Jibe front-end over iCIMS (careers.ecgmc.com).
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.ecgmc.com", ["intern", "internship", "graduate", "university"]));
};

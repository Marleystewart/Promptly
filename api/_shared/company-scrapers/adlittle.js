const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Arthur D. Little — its own iCIMS INTERNSHIPS portal, linked from the careers
// site's students page. early-careers-adlittle.icims.com redirects here.
//
// This is the firm's global student board: 25 reqs, 19 of them European, Asian
// or Latin American, so US-ness is decided from iCIMS' country-first location
// ("Boston, US") rather than a text match.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://internships-adlittle.icims.com"));
};

const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Peraton — iCIMS portal (careers-peraton.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-peraton.icims.com"));
};

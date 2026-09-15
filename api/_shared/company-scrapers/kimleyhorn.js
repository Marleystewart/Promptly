const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Kimley-Horn — iCIMS portal (careers-kimley-horn.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-kimley-horn.icims.com"));
};

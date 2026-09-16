const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Wakely Consulting Group — iCIMS portal (careers-wakely.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-wakely.icims.com"));
};

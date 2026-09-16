const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// BerryDunn — iCIMS portal (careers-berrydunn.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-berrydunn.icims.com"));
};

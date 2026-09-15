const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// SKDK — its own iCIMS portal (careers-skdk) inside parent Stagwell's account.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-skdk.icims.com"));
};

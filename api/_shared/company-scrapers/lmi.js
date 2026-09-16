const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// LMI — iCIMS portal (careers-lmi.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-lmi.icims.com"));
};

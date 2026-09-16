const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Health Management Associates — iCIMS portal (careers-healthmanagement.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-healthmanagement.icims.com"));
};

const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Dewberry — location sits in the additional-fields list, see icims.js — iCIMS portal (careers-dewberry.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-dewberry.icims.com"));
};

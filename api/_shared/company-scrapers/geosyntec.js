const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Geosyntec Consultants (its Jibe front-end returns nothing; the portal does) — iCIMS portal (careers-geosyntec.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-geosyntec.icims.com"));
};

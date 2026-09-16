const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// The Cadmus Group — iCIMS portal (careers-cadmusgroup; its title reads "The Cadmus
// Group | Careers Center"). cadmusgroup.com/careers loads it through an iCIMS widget.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://careers-cadmusgroup.icims.com"));
};

const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Lumanity — US portal; EMEA has its own — iCIMS portal (uscareers-lumanity.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://uscareers-lumanity.icims.com"));
};

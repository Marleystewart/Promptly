const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// IDC — the main (non-regional) portal; APAC/EMEA/LATAM/Canada have their own — iCIMS portal (idccareers-idg.icims.com), linked from the employer's careers page.
module.exports = async function fetchListings() {
  return usIcimsOnly(await fetchIcimsListings("https://idccareers-idg.icims.com"));
};

// Susquehanna International Group (SIG) runs a Jibe careers site
// (careers.sig.com) fronting iCIMS. Its /api/jobs endpoint returns the full
// list with real apply URLs — see api/_shared/jibe.js.
const { fetchJibeListings } = require("../jibe");

module.exports = function fetchListings() {
  return fetchJibeListings("https://careers.sig.com", ["intern", "internship", "graduate"]);
};

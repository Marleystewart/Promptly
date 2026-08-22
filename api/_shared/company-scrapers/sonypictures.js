// Sony Pictures Entertainment runs its careers site on Radancy
// (sonypicturesjobs.com). Shared parse in api/_shared/radancy.js.
const { fetchRadancyListings } = require("../radancy");

module.exports = function fetchListings() {
  return fetchRadancyListings("https://www.sonypicturesjobs.com", ["intern", "internship", "graduate"]);
};

const { fetchTalnetListings } = require("../talnet");
const { usOnly } = require("../us-location");
// L.E.K. Consulting runs tal.net; vacancy/1 is the role board. Global firm.
module.exports = async function fetchListings() {
  return usOnly(await fetchTalnetListings("https://lek.tal.net/vx/mobile-0/appcentre-1/candidate/jobboard/vacancy/1/feed"));
};

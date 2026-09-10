const { fetchTalnetListings } = require("../talnet");
const { usOnly } = require("../us-location");

// Bank of America's campus recruiting runs on tal.net (bankcampuscareers).
// vacancy/1 is the programme board; vacancy/2 is careers-roadshow EVENTS, not
// jobs, so it is deliberately not read. Global bank, so keep US-only.
const CAMPUS_FEED =
  "https://bankcampuscareers.tal.net/vx/mobile-0/appcentre-1/candidate/jobboard/vacancy/1/feed";

module.exports = async function fetchListings() {
  return usOnly(await fetchTalnetListings(CAMPUS_FEED));
};

const { fetchTalnetListings } = require("../talnet");
const { usOnly } = require("../us-location");

// Jefferies' campus board is tal.net (Talentlink), same as Evercore.
// vacancy/2 is the student/graduate board. Global firm, so US-only.
const STUDENT_FEED =
  "https://jefferies.tal.net/vx/mobile-0/appcentre-1/candidate/jobboard/vacancy/2/feed";

module.exports = async function fetchListings() {
  return usOnly(await fetchTalnetListings(STUDENT_FEED));
};

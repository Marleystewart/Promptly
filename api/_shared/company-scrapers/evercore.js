const { fetchTalnetListings } = require("../talnet");
const { usOnly } = require("../us-location");

// Evercore's campus board is a tal.net (Talentlink) Atom feed. vacancy/2 is
// "Students and Graduates"; vacancy/3 is experienced hires, which we skip.
// Global firm (Toronto/London postings), so keep only confirmed-US roles.
const STUDENT_FEED =
  "https://evercore.tal.net/vx/mobile-0/appcentre-1/candidate/jobboard/vacancy/2/feed";

module.exports = async function fetchListings() {
  return usOnly(await fetchTalnetListings(STUDENT_FEED));
};

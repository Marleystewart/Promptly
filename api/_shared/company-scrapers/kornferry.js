const { fetchTalnetListings } = require("../talnet");
const { usOnly } = require("../us-location");
// Korn Ferry — its join-korn-ferry page links a tal.net board (vacancy/3). As
// with every tal.net source the location comes from the title ("… - Chicago"),
// so a US req whose title names no city is dropped rather than guessed.
module.exports = async function fetchListings() {
  return usOnly(await fetchTalnetListings("https://kornferry.tal.net/vx/mobile-0/appcentre-ext/candidate/jobboard/vacancy/3/feed"));
};

// Unilever's first-party careers site is a Radancy board.  The shared adapter
// reads its server-rendered search rows and positively limits the global board
// to US locations.

const { fetchRadancyListings } = require("../radancy");

async function fetchListings() {
  return fetchRadancyListings(
    "https://careers.unilever.com/en",
    ["intern", "internship", "2027", "graduate"]
  );
}

module.exports = fetchListings;

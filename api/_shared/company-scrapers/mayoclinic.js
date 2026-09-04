const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");
// Mayo Clinic — Eightfold (careers.mayoclinic.org, CNAME mc.eightfold.ai).
//
// The `domain` parameter is "mc.org", NOT mayoclinic.org. Eightfold keys on the
// tenant's registered domain rather than the hostname you reach it on, and
// guessing the obvious one returns a flat 404 that looks like the whole board
// is unreachable. Read it off the careers page's own /api/pcsx/search call.
module.exports = async function fetchListings() {
  return usOnly(await fetchEightfoldListings(
    "https://careers.mayoclinic.org", "mc.org",
    ["intern", "internship", "university", "graduate"],
  ));
};

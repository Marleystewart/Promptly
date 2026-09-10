const { fetchBrassringListings } = require("../brassring");
const { usOnly } = require("../us-location");

// Edward Jones runs BrassRing (sjobs.brassring.com). Its custom fields split
// the location across city (formtext61) and state (formtext42), which the
// shared adapter reassembles. US-only firm, but keep the guard anyway.
module.exports = async function fetchListings() {
  return usOnly(await fetchBrassringListings("sjobs.brassring.com", "26235", ["5374"]));
};

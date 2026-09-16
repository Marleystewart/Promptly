const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");
// Vizient — Eightfold (careers.vizientinc.com, domain vizientinc.com).
// Locations arrive state-first with no comma ("TX Irving Corporate Office",
// "IL Chicago Van Buren; CO Centennial"), which no US test can read. Reorder to
// "Irving Corporate Office, TX" so the positive state-code check applies.
function reorder(location) {
  return String(location || "").split(/\s*;\s*/).map((part) => {
    const m = part.match(/^([A-Z]{2})\s+(.+)$/);
    return m ? `${m[2]}, ${m[1]}` : part;
  }).join("; ");
}
module.exports = async function fetchListings() {
  const rows = await fetchEightfoldListings("https://careers.vizientinc.com", "vizientinc.com", ["intern", "internship", "graduate", "university"]);
  return usOnly(rows.map((row) => ({ ...row, location: reorder(row.location) })));
};

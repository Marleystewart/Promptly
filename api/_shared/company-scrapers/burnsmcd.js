const { fetchTaleoRestListings } = require("../taleo");
const { usOnly } = require("../us-location");
// Burns & McDonnell — Taleo under its own domain (apply.burnsmcd.com), section
// "external", portal 2101430233, linked from burnsmcd.jobs. Locations are
// country-coded ("US-IL-Chicago"); taleo.js spells the country out so a
// Canadian office is never read as California. US-filtered.
module.exports = async function fetchListings() {
  return usOnly(await fetchTaleoRestListings("apply.burnsmcd.com", "external", "2101430233"));
};

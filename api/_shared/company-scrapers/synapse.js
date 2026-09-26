const { fetchTrakstarListings } = require("../trakstar");
const { usOnly } = require("../us-location");
// Synapse Energy Economics — Trakstar Hire (tenant "synapseenergy"). A
// Cambridge, MA firm, so the US filter is a formality rather than a real
// screen, but it also drops any req whose feed entry has no Location line.
module.exports = async function fetchListings() {
  return usOnly(await fetchTrakstarListings("synapseenergy"));
};

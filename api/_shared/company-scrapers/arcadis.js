const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");

// Arcadis — Eightfold. careers.arcadis.com is a marketing shell that serves a
// 404 to /api/pcsx/search; the tenant that answers is arcadis.eightfold.ai.
// The registered domain ("arcadis.com") is the value the shell's own
// eightfold.ai/events/open?domain=… link names, which is what made it findable.
//
// Global firm, so US-only. Arcadis is an engineering consultancy: its student
// hiring is water/civil/environmental interns and co-ops, plus "Entry Level"
// engineer and geologist roles, so the terms below cover both shapes.
module.exports = async function fetchListings() {
  return usOnly(await fetchEightfoldListings(
    "https://arcadis.eightfold.ai", "arcadis.com",
    ["intern", "internship", "co-op", "graduate", "entry level"],
  ));
};

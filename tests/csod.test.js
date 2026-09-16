// Cornerstone OnDemand career sites (api/_shared/csod.js). Requisition shape
// from Simon-Kucher's site on 15 Sep 2026. Locations are structured, so a
// req is US exactly when one of its places says country "US".
const assert = require("node:assert/strict");
const { toListing, usCsodOnly } = require("../api/_shared/csod.js");

const session = { origin: "https://simon-kucher.csod.com" };
const us = toListing({ requisitionId: 4261, displayJobTitle: "Summer 2027 Intern - Americas Division [UG/Masters]",
  locations: [{ city: "Atlanta", state: "GA", country: "US" }, { city: "Boston", state: "MA", country: "US" }] }, session, "simon-kucher", 6);
const mixed = toListing({ requisitionId: 4300, displayJobTitle: "Consultant",
  locations: [{ city: "Cologne", country: "DE" }, { city: "New York", state: "NY", country: "US" }] }, session, "simon-kucher", 6);
const foreign = toListing({ requisitionId: 4301, displayJobTitle: "Intern", locations: [{ city: "Toronto", state: "ON", country: "CA" }] }, session, "simon-kucher", 6);

assert.equal(us.url, "https://simon-kucher.csod.com/ux/ats/careersite/6/home/requisition/4261?c=simon-kucher");
assert.equal(us.location, "Atlanta, GA, United States; Boston, MA, United States");
assert.equal(mixed.location, "New York, NY, United States", "only the US office is shown on a mixed req");
assert.equal(foreign.us, false, "a CA country code is Canada, not California");
assert.deepEqual(usCsodOnly([us, mixed, foreign]).map((l) => l.title), ["Summer 2027 Intern - Americas Division [UG/Masters]", "Consultant"]);
assert.equal(toListing({ displayJobTitle: "No id" }, session, "x", 1), null);

console.log("CSOD tests passed. US decided by each place's own country code.");

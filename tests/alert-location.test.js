// Alerts must respect where the subscriber can actually be.
//
// matchesOpening previously considered only fields and watches, so a
// subscriber in Hartford who had not ticked "willing to relocate" could be
// emailed and pushed a role in Dallas. The app filtered by distance; the
// alerts — which are the product — did not.

const assert = require("assert");
const { matchesOpening } = require("../api/_shared/alerts.js");

const tech = (location, extra = {}) => ({ company: "Acme", field: "Technology", role: "SWE Intern", location, ...extra });

const hartford = {
  email: "s@example.com", fields: ["Technology"],
  preferredLocation: "Hartford, CT", willingToRelocate: false, remoteOkay: true,
};

// ── The bug this closes ───────────────────────────────────────────────────
assert.strictEqual(matchesOpening(tech("Dallas, TX"), hartford), false, "Dallas must not alert a Hartford subscriber");
assert.strictEqual(matchesOpening(tech("San Francisco, CA"), hartford), false, "cross-country roles must not alert");
assert.strictEqual(matchesOpening(tech("Hartford, CT"), hartford), true, "local roles must still alert");
assert.strictEqual(matchesOpening(tech("New Haven, CT"), hartford), true, "38 miles away is within alert range");
assert.strictEqual(matchesOpening(tech("New York, NY"), hartford), true, "100 miles is the documented alert radius");

// ── Remote is the rural safety valve ──────────────────────────────────────
const wyoming = { ...hartford, preferredLocation: "Casper, WY" };
assert.strictEqual(matchesOpening(tech("New York, NY"), wyoming), false, "distant roles must not alert a Wyoming subscriber");
assert.strictEqual(matchesOpening(tech("Remote - US", { remote: true }), wyoming), true, "remote must still reach rural subscribers");
assert.strictEqual(
  matchesOpening(tech("Remote", { remote: true }), { ...wyoming, remoteOkay: false }),
  false,
  "someone who turned remote off should not get remote alerts"
);

// ── Relocation opens it back up ───────────────────────────────────────────
assert.strictEqual(matchesOpening(tech("Dallas, TX"), { ...hartford, willingToRelocate: true }), true, "relocation re-enables distant roles");

// ── No preference means no restriction ────────────────────────────────────
assert.strictEqual(matchesOpening(tech("Dallas, TX"), { ...hartford, preferredLocation: "" }), true);
assert.strictEqual(matchesOpening(tech("Dallas, TX"), { ...hartford, preferredLocation: "No preference" }), true);

// ── Watches still bypass filters, as documented ───────────────────────────
const watcher = { ...hartford, watches: [{ company: "Acme" }] };
assert.strictEqual(matchesOpening(tech("Dallas, TX"), watcher), true, "an explicit watch outranks the location filter");

// ── Degrade safely, never silently ────────────────────────────────────────
assert.strictEqual(matchesOpening(tech(""), hartford), true, "a listing with no location must not be dropped on a guess");
assert.strictEqual(
  matchesOpening(tech("Hartford, CT"), { ...hartford, preferredLocation: "Nowheresville, CT" }),
  true,
  "an unplaceable town falls back to the state centroid, which still covers its own state"
);

// Field filtering must keep working alongside the new gate.
assert.strictEqual(matchesOpening({ ...tech("Hartford, CT"), field: "Finance" }, hartford), false, "field filter still applies");

console.log("Alert location tests passed.");

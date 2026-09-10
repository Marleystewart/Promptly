// Who hears from us, per account.
//
// The dashboard had one aggregate "Push enabled" number built straight from
// `pushSubscription`. Two things were wrong with that. It could not answer the
// question you actually have ("this student says alerts stopped — are they even
// registered?"), and once the iOS app shipped it counted a native user as
// having push OFF, because they hold a device token and no web endpoint.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "api/admin-stats.js"), "utf8");

// Exercise the real classifier rather than a copy of it.
const pushState = (() => {
  const match = src.match(/function pushState\(s\) \{[\s\S]*?\n\}/);
  assert.ok(match, "pushState must exist in admin-stats.js");
  return new Function(`${match[0]}; return pushState;`)();
})();

const TOKEN = "a".repeat(64);
const ENDPOINT = { endpoint: "https://fcm.googleapis.com/x" };

assert.equal(pushState({ deviceToken: TOKEN }), "app", "a device token is the iOS app");
assert.equal(pushState({ pushSubscription: ENDPOINT }), "web", "an endpoint is a browser");
assert.equal(pushState({}), "off", "nothing registered is off");
assert.equal(pushState(null), "off", "a missing record is off, not a crash");

// The regression the app shipping would have caused.
assert.notEqual(
  pushState({ deviceToken: TOKEN }),
  "off",
  "a native user must not be reported as having push switched off"
);

// The toggle and the address are separate facts and both have to hold.
assert.equal(
  pushState({ pushNotifications: false, pushSubscription: ENDPOINT }),
  "off",
  "an endpoint left over from before the toggle went off is not reach"
);
assert.equal(
  pushState({ pushNotifications: false, deviceToken: TOKEN }),
  "off",
  "the same applies to a device token"
);
assert.equal(
  pushState({ pushNotifications: true }),
  "off",
  "wanting push without ever registering is not push"
);

// The aggregate must go through the classifier, or it drifts from the rows.
assert.match(src, /if \(pushState\(s\) !== "off"\) withPush \+= 1;/,
  "the headline count must use the same rule as the per-account rows");

// Email: on is not the same as reachable. An unverified record is never queued
// a digest, so a dashboard that shows only the toggle overstates who is
// actually being emailed.
assert.match(src, /reachable: s\.emailNotifications !== false && s\.verified === true/,
  "reach requires the toggle AND a verified record");
assert.match(src, /emailReachable: subscribers\.filter/,
  "the same distinction has to exist in the headline numbers");

// ── The page has to render all three states ──────────────────────────────
const admin = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
for (const label of ["iOS app", "Browser", "On, unverified"]) {
  assert.ok(admin.includes(label), `the recent-signups table must distinguish "${label}"`);
}
assert.match(admin, /"Push", "Email reaches"/, "both columns are in the header row");

// This table is the most identifying view on the page. Adding columns must not
// quietly add new personal fields to it.
const rowMap = src.match(/\.map\(\(s\) => \(\{\s*email: s\.email[\s\S]*?\}\)\);/);
assert.ok(rowMap, "the recent-row mapping must be findable");
// gradYear is deliberately present and is already banded, never exact — see
// gradYearBand() in script.js. These are the fields that would be new leakage.
for (const field of ["major", "interests", "preferredLocation", "deviceToken:", "pushSubscription:", "savedAlerts"]) {
  assert.ok(!rowMap[0].includes(field),
    `the per-account row must not carry ${field} — it is a state summary, not a profile dump`);
}

console.log("Admin notification-state tests passed. Three push states, and email reach is not the toggle.");

// The stored push endpoint: kept while push is on, dropped when it is off.
//
// Two bugs met in resolvePushSubscription, pulling opposite ways.
//
// FUNCTIONAL: an ordinary settings save calls saveSubscriber() with no
// subscription, and serverAlertProfile() has never carried pushSubscription, so
// the computed value was null and the merge overwrote a working endpoint with
// it. Enabling push worked; changing any other setting afterwards silently
// switched it back off, with nothing anywhere saying so.
//
// PRIVACY: a push endpoint identifies one browser install and is the address we
// can reach it at. Keeping it after someone turns push off is retention past
// the purpose it was collected for.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { resolvePushSubscription } = require("../api/_shared/store");

const ROOT = path.join(__dirname, "..");
const KEPT = { endpoint: "https://fcm.googleapis.com/kept" };
const FRESH = { endpoint: "https://fcm.googleapis.com/fresh" };

// The regression: a save that carries no subscription must not erase one.
assert.deepEqual(
  resolvePushSubscription({ pushSubscription: KEPT }, { pushNotifications: true, pushSubscription: null }, null),
  KEPT,
  "an ordinary settings save must not wipe the stored endpoint"
);

// A newly supplied subscription wins, including a rotated one.
assert.deepEqual(
  resolvePushSubscription({}, { pushNotifications: true, pushSubscription: FRESH }, FRESH),
  FRESH,
  "enabling push stores the endpoint"
);
assert.deepEqual(
  resolvePushSubscription({ pushSubscription: KEPT }, { pushNotifications: true, pushSubscription: FRESH }, FRESH),
  FRESH,
  "a rotated endpoint replaces the old one"
);

// Turning push off drops it — the privacy half.
assert.equal(
  resolvePushSubscription({ pushSubscription: KEPT }, { pushNotifications: false, pushSubscription: null }, null),
  null,
  "switching push off must drop the stored endpoint, not merely stop sending"
);
assert.equal(
  resolvePushSubscription({ pushSubscription: KEPT }, { pushNotifications: false, pushSubscription: FRESH }, FRESH),
  null,
  "push off wins even if a subscription is supplied in the same request"
);

// Nothing invented when there never was one.
assert.equal(
  resolvePushSubscription({}, { pushNotifications: true, pushSubscription: null }, null),
  null
);

// The merge must actually route through this, or the spread reintroduces the bug.
{
  const store = fs.readFileSync(path.join(ROOT, "api/_shared/store.js"), "utf8");
  assert.match(store, /pushSubscription: resolvePushSubscription\(existing, subscriber, subscription\)/,
    "saveSubscriber must resolve the endpoint after the spread, not let the spread decide");
}

// The notification payload stays minimal: a lock screen is visible to anyone
// holding the phone, so it carries the employer and role and nothing personal.
{
  const alerts = fs.readFileSync(path.join(ROOT, "api/_shared/alerts.js"), "utf8");
  const pushes = alerts.match(/return pushWithPruning\(subscriber, \{[\s\S]*?\}\);/g) || [];
  assert.ok(pushes.length >= 2, "expected the new-opening and deadline pushes");
  for (const payload of pushes) {
    for (const field of ["school", "gradYear", "major", "interests", "email", "subscriber.name"]) {
      assert.ok(!payload.includes(field), `a lock-screen payload must not carry ${field}`);
    }
  }
}

console.log("Push retention tests passed. Kept while on, dropped when off, payload minimal.");

// Switching push off must release the BROWSER's subscription too. Clearing what
// we store stops us sending, but the subscription still exists at the vendor's
// push service until it is unsubscribed. "Off" should mean off everywhere.
{
  const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
  const release = script.match(/async function releasePushSubscription\(\)[\s\S]*?\n}/)[0];
  assert.match(release, /removeItem\("openingPushSubscription"\)/, "the locally cached copy goes too");
  assert.match(release, /existing\.unsubscribe\(\)/, "the browser subscription is actually released");
  assert.match(
    script,
    /if \(pref === "pushNotifications" && !input\.checked\) await releasePushSubscription\(\);\s*\n\s*saveSubscriber\(\);/,
    "release must happen BEFORE the server save, so a failure cannot leave us holding an endpoint we promised to drop"
  );
}

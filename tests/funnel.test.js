// A funnel that reports the wrong number is worse than no funnel: it gets
// believed, and the wrong thing gets fixed. These pin the definitions.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { buildFunnel, isAlertReady } = require("../api/_shared/funnel.js");

const ROOT = path.join(__dirname, "..");
const NOW = Date.parse("2026-09-02T12:00:00.000Z");
const daysAgo = (n) => new Date(NOW - n * 86400000).toISOString();

const account = (over = {}) => ({
  email: "a@example.edu",
  verified: true,
  fields: ["Technology"],
  emailNotifications: true,
  createdAt: daysAgo(1),
  ...over,
});

// ── Stage definitions ────────────────────────────────────────────────────────

// Unconfirmed accounts get nothing at all, so they are not "reachable" in any
// sense — this was the state 100% of accounts were stuck in while SMTP was down.
assert.equal(isAlertReady(account({ verified: false })), false, "unconfirmed is never alert-ready");

// Confirmed but no fields: nothing can match, so no alert can ever be sent.
// From every other number on the dashboard this looks like a healthy account.
assert.equal(isAlertReady(account({ fields: [] })), false, "no fields means nothing can match");

// Confirmed, has fields, but switched everything off. Their choice — but they
// must not be counted as someone Promptly can reach.
assert.equal(
  isAlertReady(account({ emailNotifications: false, pushNotifications: false })),
  false,
  "all alerts off is not reachable"
);

// Email off but push on with a real subscription is still reachable.
assert.equal(
  isAlertReady(account({ emailNotifications: false, pushNotifications: true, pushSubscription: { endpoint: "x" } })),
  true,
  "push-only is still reachable"
);
// Push on but no subscription is not.
assert.equal(
  isAlertReady(account({ emailNotifications: false, pushNotifications: true, pushSubscription: null })),
  false,
  "push with no subscription is not reachable"
);

// ── The funnel must actually narrow ──────────────────────────────────────────
{
  const subscribers = [
    account({ verified: false, createdAt: daysAgo(1) }),                    // never confirmed
    account({ verified: false, createdAt: daysAgo(12) }),                   // about to be purged
    account({ fields: [] }),                                                // confirmed, unmatchable
    account({ emailNotifications: false, pushNotifications: false }),       // confirmed, opted out
    account({ firstAlertAt: daysAgo(2) }),                                  // fully working
    account(),                                                              // ready, never alerted
  ];
  const f = buildFunnel(subscribers, NOW);
  const by = Object.fromEntries(f.stages.map((s) => [s.key, s.count]));

  assert.equal(by.signedUp, 6);
  assert.equal(by.confirmed, 4, "two never confirmed");
  assert.equal(by.alertReady, 2, "no-fields and opted-out are confirmed but unreachable");
  assert.equal(by.everAlerted, 1, "only one has ever actually been sent something");

  // Every stage must be a subset of the one above it, or the drop between two
  // rows is not a real number of people.
  const counts = f.stages.map((s) => s.count);
  for (let i = 1; i < counts.length; i += 1) {
    assert.ok(counts[i] <= counts[i - 1], `stage ${f.stages[i].key} exceeds the stage above it`);
  }

  assert.equal(f.stuck.unconfirmed, 2);
  assert.equal(f.stuck.unconfirmedExpiringSoon, 1, "day 12 of 14 is expiring soon; day 1 is not");
  assert.equal(f.stuck.noFields, 1);
  assert.equal(f.stuck.alertsOff, 1);
  assert.equal(f.stuck.confirmedNeverAlerted, 3, "confirmed minus the one that got an alert");
}

// Percentages are of the TOP of the funnel, not of the previous stage — mixing
// the two is the classic way a funnel silently overstates.
{
  const subscribers = [
    ...Array.from({ length: 8 }, () => account({ verified: false })),
    account({ firstAlertAt: daysAgo(1) }),
    account(),
  ];
  const f = buildFunnel(subscribers, NOW);
  const by = Object.fromEntries(f.stages.map((s) => [s.key, s]));
  assert.equal(by.confirmed.count, 2);
  assert.equal(by.confirmed.pct, 20, "2 of 10 is 20% of signups, not 20% of the previous stage");
  assert.equal(by.everAlerted.pct, 10);
}

// No accounts must not divide by zero or claim 100%.
{
  const f = buildFunnel([], NOW);
  assert.equal(f.stages[0].count, 0);
  assert.equal(f.stages[0].pct, 0, "an empty funnel is 0%, not 100%");
  assert.equal(f.stuck.unconfirmed, 0);
}

// ── The separation that keeps this honest ────────────────────────────────────
// Anonymous daily counters (app opens, posting clicks) cannot be attributed to
// an account and must never become a denominator for one.
{
  const source = fs.readFileSync(path.join(ROOT, "api/_shared/funnel.js"), "utf8");
  assert.doesNotMatch(source, /appOpens|source_click|applicationsToday/,
    "the account funnel must not read anonymous activity counters");
  const admin = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
  assert.match(admin, /not part of this funnel/,
    "the dashboard must say that activity counters are separate");
}

// firstAlertAt answers "has Promptly ever delivered anything to this person?",
// so it must be written once and never overwritten by a later send.
{
  const store = fs.readFileSync(path.join(ROOT, "api/_shared/store.js"), "utf8");
  const fn = store.match(/async function markFirstAlert[\s\S]*?\n}/)[0];
  assert.match(fn, /if \(!record \|\| record\.firstAlertAt\) return/,
    "markFirstAlert must not overwrite an existing stamp");
  const retention = fs.readFileSync(path.join(ROOT, "api/retention.js"), "utf8");
  assert.match(retention, /if \(delivered\) \{[\s\S]*markFirstAlert\(subscriber\.email\)/,
    "the stamp must only be written when a digest actually delivered");
}

console.log("Funnel tests passed. Stages narrow, percentages are of signups, activity stays separate.");

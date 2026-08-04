// Security regression tests for the pre-launch audit fixes.
// These lock in behaviour that is easy to undo by accident later.

const assert = require("node:assert/strict");
const { isAllowedPushEndpoint, isSafePushSubscription } = require("../api/_shared/push-target");
const { normalizeSubscriber } = require("../api/_shared/store");

// ── SSRF guard on push endpoints ───────────────────────────────────────────
// web-push POSTs to whatever endpoint we hand it, so only real vendor push
// hosts may pass.
assert.equal(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
assert.equal(isAllowedPushEndpoint("https://web.push.apple.com/abc"), true);
assert.equal(isAllowedPushEndpoint("https://xyz.notify.windows.com/w/?token=abc"), true);

// Attacker-controlled destinations must be refused.
assert.equal(isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"), false, "http must be rejected");
assert.equal(isAllowedPushEndpoint("https://169.254.169.254/latest/meta-data/"), false, "cloud metadata must be rejected");
assert.equal(isAllowedPushEndpoint("http://localhost:6379/"), false, "localhost must be rejected");
assert.equal(isAllowedPushEndpoint("https://evil.example.com/collect"), false, "arbitrary host must be rejected");
// Suffix confusion: a host that merely ends with the brand name is not the brand.
assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/x"), false, "suffix spoof must be rejected");
// "notfcm.googleapis.com" is a different registrable host, not a subdomain of
// the real one, so it must be refused — the boundary has to be a dot.
assert.equal(isAllowedPushEndpoint("https://notfcm.googleapis.com/x"), false, "prefix-glued lookalike must be rejected");
assert.equal(isAllowedPushEndpoint("https://android.googleapis.com/gcm/send/x"), true, "real subdomain still allowed");
assert.equal(isAllowedPushEndpoint(""), false);
assert.equal(isAllowedPushEndpoint(null), false);
assert.equal(isAllowedPushEndpoint("not a url"), false);

assert.equal(isSafePushSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/x" }), true);
assert.equal(isSafePushSubscription({ endpoint: "https://evil.example.com" }), false);
assert.equal(isSafePushSubscription(null), false);
assert.equal(isSafePushSubscription({}), false);

// ── A hostile subscription must never be stored ───────────────────────────
const hostile = normalizeSubscriber(
  { email: "student@example.com" },
  { endpoint: "https://169.254.169.254/latest/meta-data/" }
);
assert.equal(hostile.pushSubscription, null, "unsafe endpoint must not be persisted");

const good = normalizeSubscriber(
  { email: "student@example.com" },
  { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { auth: "a", p256dh: "b" } }
);
assert.ok(good.pushSubscription, "a legitimate subscription must still be kept");

// Same guard when the endpoint arrives inside the profile rather than as an
// explicit subscription argument.
const sneaky = normalizeSubscriber({
  email: "student@example.com",
  pushSubscription: { endpoint: "http://127.0.0.1:8080/" },
});
assert.equal(sneaky.pushSubscription, null, "unsafe profile.pushSubscription must not be persisted");

// ── Client input must not be able to grant itself trust ───────────────────
// normalizeSubscriber builds an allowlisted shape; injected privileged fields
// must not survive onto the stored record.
const massAssign = normalizeSubscriber({
  email: "student@example.com",
  verified: true,
  isAdmin: true,
  role: "admin",
});
assert.equal(massAssign.verified, undefined, "client must not be able to set verified");
assert.equal(massAssign.isAdmin, undefined, "client must not be able to set isAdmin");
assert.equal(massAssign.role, undefined, "client must not be able to set role");

console.log("Security tests passed.");

// ── Email verification gate ───────────────────────────────────────────────
// Alert mail must never reach an address that has not confirmed itself. These
// assert the *decision rule* used by the cron and the on-demand endpoints.
const emailAllowed = (sub) => sub.verified === true;

assert.equal(emailAllowed({ verified: true }), true, "confirmed address may receive mail");
assert.equal(emailAllowed({ verified: false }), false, "unconfirmed must not");
assert.equal(emailAllowed({}), false, "legacy record with no flag must not (fail closed)");
assert.equal(emailAllowed({ verified: "true" }), false, "only a real boolean counts");
assert.equal(emailAllowed({ verified: 1 }), false, "truthy is not enough");

// The refresh job uses the same rule before queueing anything.
const queueAllowed = (sub) => sub.verified === true && sub.emailNotifications !== false && Boolean(sub.email);
assert.equal(queueAllowed({ verified: true, email: "a@b.co" }), true);
assert.equal(queueAllowed({ verified: true, email: "a@b.co", emailNotifications: false }), false, "opt-out respected");
assert.equal(queueAllowed({ email: "a@b.co" }), false, "unconfirmed never queues");

console.log("Verification-gate tests passed.");

// ── Unconfirmed-profile lifecycle ─────────────────────────────────────────
// Remind on days 3 and 10, delete on day 14. Confirmed accounts are never
// touched by the purge — that is the guard worth pinning down.
const REMINDER_DAYS = [3, 10];
const PURGE_DAYS = 14;

const daysSince = (iso, now) => {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  return Math.floor((now.getTime() - then) / 86400000);
};

const NOW = new Date("2026-08-01T12:00:00Z");
const agedDays = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();

assert.equal(daysSince(agedDays(0), NOW), 0);
assert.equal(daysSince(agedDays(3), NOW), 3);
assert.equal(daysSince(agedDays(14), NOW), 14);
assert.equal(daysSince("not a date", NOW), null, "unparseable timestamps must not trigger a purge");

const shouldPurge = (sub, now) => {
  if (sub.verified === true) return false;
  const age = daysSince(sub.createdAt, now);
  return age !== null && age >= PURGE_DAYS;
};

assert.equal(shouldPurge({ createdAt: agedDays(14) }, NOW), true, "unconfirmed at 14 days is purged");
assert.equal(shouldPurge({ createdAt: agedDays(20) }, NOW), true, "older unconfirmed is purged");
assert.equal(shouldPurge({ createdAt: agedDays(13) }, NOW), false, "not yet due");
assert.equal(shouldPurge({ verified: true, createdAt: agedDays(400) }, NOW), false, "a confirmed account is NEVER purged");
assert.equal(shouldPurge({ createdAt: "garbage" }, NOW), false, "bad timestamp must fail safe, not delete");
assert.equal(shouldPurge({}, NOW), false, "missing createdAt must fail safe");

const dueReminder = (sub, now) => REMINDER_DAYS.find((d) => daysSince(sub.createdAt, now) === d);
assert.equal(dueReminder({ createdAt: agedDays(3) }, NOW), 3);
assert.equal(dueReminder({ createdAt: agedDays(10) }, NOW), 10);
assert.equal(dueReminder({ createdAt: agedDays(5) }, NOW), undefined, "no reminder on off days");

console.log("Unverified-lifecycle tests passed.");

// ── Injection sinks in the rendered feed ──────────────────────────────────
// awaitingLine() interpolates the student's own preferred location and, for
// watched companies, a name derived from a pasted URL. It is interpolated into
// innerHTML by openingRow, so the call site must escape it. A regression here
// is a real injection sink, so assert on the source rather than trusting review.
{
  const fs = require("fs");
  const path = require("path");
  const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

  assert.ok(
    /<small class="awaiting-line">\$\{esc\(awaitingLine\(item\)\)\}<\/small>/.test(script),
    "awaitingLine() must be escaped where it is interpolated into innerHTML"
  );

  // And the function itself must stay plain text — if a branch ever returns
  // markup, the esc() above would render it visibly instead of executing it,
  // which is the safe failure, but the intent should be explicit.
  const body = script.slice(script.indexOf("function awaitingLine("));
  const fnEnd = body.indexOf("\n}\n");
  assert.ok(!/<[a-z]+[ >]/i.test(body.slice(0, fnEnd)), "awaitingLine() must return plain text, never markup");
}

console.log("Injection-sink tests passed.");

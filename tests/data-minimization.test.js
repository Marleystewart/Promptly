// Two stores, two purposes, two different payloads.
//
//   accountProfile()     -> Supabase user_metadata. Exists so a profile follows
//                           you to a new device, so it carries what you filled in.
//   serverAlertProfile() -> Upstash. Only needs what decides whether a listing
//                           matches you and how to reach you.
//
// serverAlertProfile used to spread accountProfile wholesale, which sent the
// alert store `major` and `interests`. matchesOpening() never reads either and
// no dashboard counts them, so every stored copy was retention with no purpose
// — the August audit's P-09.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const alerts = fs.readFileSync(path.join(ROOT, "api/_shared/alerts.js"), "utf8");

const alertPayload = script.match(/function serverAlertProfile\(\)[\s\S]*?\n}/)[0];
const accountPayload = script.match(/function accountProfile\(\)[\s\S]*?\n}/)[0];

// It must no longer be a spread of the account profile, or it silently regains
// every field anyone adds there later.
assert.doesNotMatch(alertPayload, /\.\.\.accountProfile\(\)/,
  "the alert payload must be its own allowlist, not a copy of the account one");

// Fields nothing server-side reads must not be sent to the alert store.
for (const field of ["major", "interests", "photoDataUrl", "resumeText", "resumeName"]) {
  assert.doesNotMatch(alertPayload, new RegExp(`\\b${field}\\s*:`),
    `${field} is read by nothing server-side and must not reach the alert store`);
}

// Portability is a separate concern: the account copy legitimately keeps them,
// otherwise signing in on a new device loses your major and interests.
for (const field of ["major", "interests"]) {
  assert.match(accountPayload, new RegExp(`\\b${field}\\s*:`),
    `${field} must stay in the account profile so it follows you across devices`);
}

// Everything matching actually consumes must survive the narrowing.
for (const field of ["fields", "preferredLocation", "remoteOkay", "willingToRelocate", "email", "name"]) {
  assert.match(alertPayload, new RegExp(`\\b${field}\\s*:`),
    `${field} is used by matchesOpening() and must still be sent`);
}
for (const consumed of ["subscriber.fields", "subscriber.preferredLocation", "subscriber.remoteOkay"]) {
  assert.ok(alerts.includes(consumed), `sanity: alerts.js really does read ${consumed}`);
}

// Stopping new writes does not clear what is already stored, and a dormant
// account never saves again.
{
  const erase = fs.readFileSync(path.join(ROOT, "api/_shared/erase.js"), "utf8");
  assert.match(erase, /const MINIMIZE_FIELDS = \["major", "interests"\]/);
  assert.match(erase, /async function minimizeSubscriberProfiles/);
  const retention = fs.readFileSync(path.join(ROOT, "api/retention.js"), "utf8");
  assert.match(retention, /minimizeSubscriberProfiles\(redis, emails\)/,
    "the daily job must scrub existing records, not only future writes");
  assert.match(retention, /recordPrivacyCleanup\(privacyCleanup\)/,
    "cleanup counts must be persisted so they can actually be confirmed");
}

console.log("Data-minimization tests passed. The alert store gets only what it reads.");

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
// gradYear is included: the server only ever used it for a demographic tile,
// and it now receives a band instead — exact school plus exact graduation year
// is close to identifying in a cohort this small.
for (const field of ["major", "interests", "gradYear", "photoDataUrl", "resumeText", "resumeName"]) {
  assert.doesNotMatch(alertPayload, new RegExp(`\\b${field}\\s*:`),
    `${field} is read by nothing server-side and must not reach the alert store`);
}

// Portability is a separate concern: the account copy legitimately keeps them,
// otherwise signing in on a new device loses your major, interests and the
// exact year that drives cycle matching in the app itself.
for (const field of ["major", "interests", "gradYear"]) {
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
  assert.match(erase, /const MINIMIZE_FIELDS = \["major", "interests", "gradYear"\]/,
    "stored exact graduation years must be scrubbed too, not only new writes");
  assert.match(erase, /async function minimizeSubscriberProfiles/);
  const retention = fs.readFileSync(path.join(ROOT, "api/retention.js"), "utf8");
  assert.match(retention, /minimizeSubscriberProfiles\(redis, emails\)/,
    "the daily job must scrub existing records, not only future writes");
  assert.match(retention, /recordPrivacyCleanup\(privacyCleanup\)/,
    "cleanup counts must be persisted so they can actually be confirmed");
}

// ── The band itself ─────────────────────────────────────────────────────────
{
  const vm = require("node:vm");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(
    script.match(/function gradYearBand[\s\S]*?\n}/)[0] + "; this.band = gradYearBand;",
    sandbox
  );
  const band = sandbox.band;
  const NOW = new Date("2026-09-03T00:00:00Z"); // academic year 2027

  assert.equal(band("2028", NOW), "1 year out");
  assert.equal(band("2029", NOW), "2 years out");
  assert.equal(band("2031", NOW), "3+ years out");
  assert.equal(band("2027", NOW), "graduated or graduating");
  assert.equal(band("2020", NOW), "graduated or graduating");

  // Never leak the exact year through the band.
  for (const year of ["2027", "2028", "2029", "2031"]) {
    assert.doesNotMatch(band(year, NOW), new RegExp(year),
      `the band must not contain the exact year (${year})`);
  }

  // Missing or junk input must not become a bogus band.
  for (const value of ["", null, undefined, "abc", "  "]) {
    assert.equal(band(value, NOW), "", `${JSON.stringify(value)} has no band`);
  }

  // The band tracks the academic year, which rolls in the autumn — so the same
  // student reads differently in July and September, correctly.
  assert.equal(band("2027", new Date("2026-07-01T00:00:00Z")), "1 year out");
  assert.equal(band("2027", new Date("2026-09-01T00:00:00Z")), "graduated or graduating");
}

// The dashboard must group and display the band, never the raw year.
{
  const admin = fs.readFileSync(path.join(ROOT, "api/admin-stats.js"), "utf8");
  assert.match(admin, /s\.gradYearBand \|\| ""/, "grouping must use the band");
  assert.doesNotMatch(admin, /\(s\.gradYear \|\| ""\)\.trim\(\)/, "not the exact year");
  assert.match(admin, /gradYear: s\.gradYearBand/, "the per-account row must show the band too");
}

console.log("Data-minimization tests passed. The alert store gets only what it reads.");

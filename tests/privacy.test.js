// Privacy promises must be enforced by data flow, not only by copy.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { emailBelongsToUser } = require("../api/_shared/auth-user");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const policy = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
const reports = fs.readFileSync(path.join(root, "api", "_shared", "reports.js"), "utf8");
const testPush = fs.readFileSync(path.join(root, "api", "send-test.js"), "utf8");
const authBoundary = fs.readFileSync(path.join(root, "api", "_shared", "auth-user.js"), "utf8");

// Analytics has no stable browser identifier and application progress remains
// device-only rather than becoming an exact-school/company event.
assert.doesNotMatch(script, /promptlySession|sessionId\s*:/, "analytics must not create or send a persistent identifier");
assert.doesNotMatch(script, /JSON\.stringify\(\{\s*company:\s*item\.company,\s*stage,\s*school:/,
  "application progress must not leave the device");

// API requests use a narrow allowlist instead of serializing the entire local
// profile, which contains a profile photo and device-only UI state.
const start = script.indexOf("function serverAlertProfile(");
const end = script.indexOf("\n}\n", start);
const allowlist = script.slice(start, end);
assert.ok(start >= 0, "serverAlertProfile allowlist must exist");
assert.doesNotMatch(allowlist, /resumeText|photoDataUrl|resumeName/, "device-only fields must not be allowlisted");

// Résumé upload was removed for privacy: it invited exactly the kind of personal
// detail Promptly has no reason to hold. Nothing may reintroduce it, and any
// text an earlier version stored must be deleted from the device on upgrade.
assert.doesNotMatch(script, /data-resume-|PromptlyResume|extractResumeText/,
  "the resume upload feature must stay removed");
assert.match(script, /delete profile\.resumeText;[\s\S]*delete profile\.resumeName;/,
  "a resume stored by an earlier version must be purged from localStorage on load");
assert.match(script, /if \("resumeText" in profile \|\| "resumeName" in profile\)[\s\S]*localStorage\.setItem\(profileStorageKey/,
  "the purge must be written back, not left until the next save");
assert.match(script, /profile:\s*serverAlertProfile\(\)/, "test-email requests must use the allowlist");

// Sign-out must remove local data before another person uses the same browser.
// This now also covers the device-only profile, which has no Supabase session
// to end but holds the photo and saved alerts locally.
const signOutBlock = script.match(/async function signOutAndReset\(\)[\s\S]*?\n}\n/)[0];
assert.match(signOutBlock, /clearPromptlyClientState\(localStorage, sessionStorage\)/);
assert.match(signOutBlock, /resettingClientState = true/,
  "sign-out must stop pending writes before wiping, or state is written back after the clear");
assert.match(signOutBlock, /if \(!authUser\)[\s\S]*window\.confirm/,
  "clearing a device-only profile is unrecoverable and must be confirmed first");
assert.match(script, /if \(signOutButton\) \{\s*await signOutAndReset\(\);/,
  "the sign-out button must route through the reset path");

// Account ownership comes from the verified session, never a JSON email.
assert.equal(emailBelongsToUser("student@example.edu", "STUDENT@example.edu"), true);
assert.equal(emailBelongsToUser("attacker@example.edu", "student@example.edu"), false);
assert.match(authBoundary, /Boolean\(user\?\.email_confirmed_at\)/,
  "server ownership checks must require Supabase's confirmed-email timestamp");
assert.match(authBoundary, /settings\?\.mailer_autoconfirm\s*!==\s*false/,
  "server ownership checks must fail closed if Supabase email confirmation is disabled");

// Listing reports do not silently repurpose the account email.
assert.match(reports, /lastReporterEmail:\s*null/);
assert.doesNotMatch(script.slice(script.indexOf('action: "report"'), script.indexOf("const data = await res.json", script.indexOf('action: "report"'))),
  /email:/, "report payload must not include the account email");

// A signed-in account may test only the push endpoint already stored for it.
assert.match(testPush, /getSubscriber\(auth\.email\)/);
assert.match(testPush, /requestedEndpoint\s*!==\s*storedEndpoint/);

// The public disclosure names core processors and the lack of AI/session replay.
for (const disclosure of ["Supabase", "jsDelivr", "Upstash", "Resend", "Vercel", "session-replay", "large-language-model"]) {
  assert.match(policy, new RegExp(disclosure, "i"), `privacy page must disclose ${disclosure}`);
}
assert.match(index, /signup-privacy-note[\s\S]*href="\/privacy"[\s\S]*href="\/terms"/,
  "account collection must include a just-in-time privacy and terms notice");

console.log("Privacy data-flow regression tests passed.");

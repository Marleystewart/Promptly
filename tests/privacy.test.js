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
// profile, which contains résumé text and a profile photo.
const start = script.indexOf("function serverAlertProfile(");
const end = script.indexOf("\n}\n", start);
const allowlist = script.slice(start, end);
assert.ok(start >= 0, "serverAlertProfile allowlist must exist");
assert.doesNotMatch(allowlist, /resumeText|photoDataUrl|resumeName/, "device-only fields must not be allowlisted");
assert.match(script, /profile:\s*serverAlertProfile\(\)/, "test-email requests must use the allowlist");

// Sign-out must remove local data before another person uses the same browser.
const signOutBlock = script.slice(script.indexOf("if (signOutButton && authClient)"), script.indexOf("if (deleteAccountButton)"));
assert.match(signOutBlock, /clearPromptlyClientState\(localStorage, sessionStorage\)/);

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

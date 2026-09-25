// Password managers need to recognise the account screen.
//
// Safari offers to create a strong password only when it can see a username
// field and a new-password field inside a <form>. Promptly's inputs were bare
// — no form, and the email field advertised itself as "email" rather than
// "username" — so iCloud Keychain, 1Password and the rest had nothing to latch
// onto, and every student invented their own password.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");

const form = html.match(/<form[^>]*data-auth-form[\s\S]*?<\/form>/);
assert.ok(form, "the account fields must live inside a form");
const body = form[0];

// The three signals, together. Any one alone is not enough.
assert.match(body, /autocomplete="username"/, "the account field must be username, not email");
assert.match(body, /autocomplete="new-password"/, "the password field must advertise new-password");
assert.ok(
  body.indexOf('autocomplete="username"') < body.indexOf('autocomplete="new-password"'),
  "username must come before password — managers pair them in document order"
);

// Named and identified: heuristics fall back to these when autocomplete is
// ambiguous, and a field with neither is often skipped entirely.
for (const attr of ['name="username"', 'name="password"', 'id="auth-username"', 'id="auth-password"']) {
  assert.ok(body.includes(attr), `the form must carry ${attr}`);
}

// Sign-in must ask for the EXISTING password. Left on new-password, a manager
// offers to invent another one instead of filling the one already saved.
assert.match(
  script,
  /autocomplete = authMode === "signin" \? "current-password" : "new-password"/,
  "signing in must switch the field to current-password"
);

// The submit button stays type="button": submission runs through the existing
// delegated click listener, and a real submit button would fire it twice.
assert.match(body, /<button[^>]*type="button"[^>]*data-auth-submit/,
  "the submit control must remain type=button");

assert.match(body, /data-password-toggle/, "students need a way to reveal a mistyped password");
assert.match(script, /input\.type = showing \? "password" : "text"/,
  "the password visibility control must switch the real input type");

assert.match(html, /data-auth-confirmation/, "email signup needs a distinct check-your-inbox state");
assert.match(script, /function showAuthConfirmation\(email\)/,
  "successful email signup must leave the editable account form");
assert.match(script, /if \(authAttemptInFlight\) return;/,
  "repeated taps must not launch duplicate account requests");
assert.match(html, /School email on Outlook\?/, "the confirmation screen must name the common Outlook school-inbox failure");
assert.match(html, /data-auth-confirmation-resend/, "a missing confirmation email must be resendable without restarting signup");
assert.match(html, /data-auth-confirmation-change/, "students need a personal-email escape hatch when a school blocks auth mail");
assert.match(script, /authClient\.auth\.resend\(\{[\s\S]*type: "signup"/,
  "resend must request another signup confirmation from the auth provider");
assert.match(script, /emailRedirectTo: authEmailRedirectUrl\(\)/,
  "confirmation links must return to the current Promptly web origin");
assert.match(script, /return isNativeShell\(\) \? API_ORIGIN : window\.location\.origin/,
  "native confirmation links must open the web app instead of capacitor://localhost");

// Which means Enter needs bridging, and nothing may navigate away.
assert.match(script, /form\.querySelector\("\[data-auth-submit\]"\)\?\.click\(\)/,
  "Enter inside the form must trigger the same submit path");
assert.match(script, /if \(event\.target\.matches\?\.\("\[data-auth-form\]"\)\) event\.preventDefault\(\)/,
  "a stray form submit must never navigate away from the account screen");

console.log("Auth autofill tests passed. A password manager can see a username, a new password, and a form.");

// Signup does not wait on the inbox.
//
// School Microsoft 365 tenants hold new mail for minutes while they scan it,
// and a first visit that stalls on "check your inbox" is where students give
// up. So an unconfirmed signup carries on into setup on an on-device profile,
// and the emailed code goes in a bar at the top whenever it arrives.
//
// The thing to protect: skipping ahead must not unlock anything that proving
// ownership of the inbox is for. Turning off Supabase's "Confirm email" would
// have been simpler and would have marked every address confirmed on sight —
// letting anyone sign up with someone else's .edu and have Promptly email them.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const markup = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const fn = (name) => {
  const start = script.search(new RegExp(`(async )?function ${name}\\(`));
  assert.ok(start >= 0, `${name} must exist`);
  return script.slice(start, script.indexOf("\n}\n", start));
};

// ── Signup continues instead of stopping ────────────────────────────────────
const submit = fn("handleAuthSubmit");
assert.match(submit, /setOnboardingStep\(2\);\s*renderCodeBar\(\);/,
  "an unconfirmed signup must go straight into setup with the code bar up");
assert.doesNotMatch(submit, /showAuthConfirmation\(email\)/,
  "signup must not block on a waiting screen");

// ── Nothing is unlocked early ───────────────────────────────────────────────
// No session exists until the code is verified, so the alert profile cannot
// be saved — and must not be attempted, or it is a guaranteed failed request.
assert.match(fn("enterApp"), /if \(authUser \|\| !authClient\) saveSubscriber\(\)/,
  "finishing setup before confirming must not try to save alerts without an account");
// ...and it must be saved the moment the account IS confirmed, or the student
// ends up signed in and silently never alerted.
assert.match(fn("verifyCodeBar"), /if \(authUser && accountProfileIsComplete\(\)\) saveSubscriber\(\)/,
  "confirming must save the alert profile set up while waiting");
// Verification still goes through Supabase's own OTP check.
assert.match(fn("verifyEmailCode"), /verifyOtp\(\{ email, token, type: "email" \}\)/,
  "the code must be checked by Supabase, not locally");

// ── The bar shows exactly while something is waiting ────────────────────────
const render = fn("renderCodeBar");
assert.match(render, /authClient && !authUser && email/,
  "the bar must show only for an unconfirmed account with a pending address");
// The bar and the profile migration key off the same address, so they can
// never disagree about whether there is something to move into the account.
assert.match(fn("pendingSignupEmail"), /promptlyPendingMigrationEmail/,
  "the bar must read the same key the migration uses");
assert.match(script, /localStorage\.removeItem\("promptlyPendingMigrationEmail"\);\s*renderCodeBar\(\);/,
  "confirming must hide the bar");
// Reopening the app before the code came must bring the bar back.
assert.match(script, /routeAuthenticatedUser\(session\?\.user\);\s*pendingOAuthCallback = false;[\s\S]{0,200}renderCodeBar\(\);/,
  "a returning unconfirmed student must see the bar again");

// ── Mid-setup confirmation keeps their place ────────────────────────────────
assert.match(script, /if \(current < 2\) setOnboardingStep\(2\)/,
  "confirming on a later setup step must not send them back to the start");

// ── The bar itself ──────────────────────────────────────────────────────────
assert.match(markup, /data-code-bar-input[^>]*autocomplete="one-time-code"/,
  "the bar's input must allow code autofill");
assert.match(markup, /data-code-bar-input[^>]*inputmode="numeric"/,
  "the bar's input must bring up the number pad");
assert.match(markup, /subject line/,
  "the bar must say where to find the code, since the email itself may be held");
assert.match(markup, /data-code-bar-change/, "a mistyped address needs a way out");
// The bar sits above onboarding in the page, or it renders under the signup card.
assert.ok(markup.indexOf("data-code-bar ") < markup.indexOf('class="onboarding-shell"'),
  "the bar must come before the onboarding shell so it shows at the top");

console.log("Instant signup tests passed. Straight into setup, code whenever it lands, nothing unlocked early.");

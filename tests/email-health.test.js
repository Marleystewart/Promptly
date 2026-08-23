// Email delivery must never be able to fail silently again.
//
// Resend ACCEPTS the shared sandbox sender (onboarding@resend.dev) but delivers
// it only to the Resend account owner. Because nothing distinguished that from
// a working setup, Promptly could not deliver a single confirmation email —
// and since alerts are gated on `verified === true`, which requires clicking a
// link in that email, the entire email product was dead end to end with no
// error anywhere.
//
// These assertions pin the distinction that was missing.

const assert = require("node:assert/strict");
const { configState, isSandboxSender } = require("../api/_shared/email-health");

const original = {
  key: process.env.RESEND_API_KEY,
  from: process.env.ALERT_FROM_EMAIL,
};

function withEnv({ key, from }, fn) {
  if (key === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = key;
  if (from === undefined) delete process.env.ALERT_FROM_EMAIL;
  else process.env.ALERT_FROM_EMAIL = from;
  try { return fn(); } finally {
    if (original.key === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original.key;
    if (original.from === undefined) delete process.env.ALERT_FROM_EMAIL;
    else process.env.ALERT_FROM_EMAIL = original.from;
  }
}

// The sandbox sender is recognised in every form it can appear.
assert.ok(isSandboxSender("onboarding@resend.dev"));
assert.ok(isSandboxSender("Promptly <onboarding@resend.dev>"));
assert.ok(isSandboxSender("Promptly <ONBOARDING@RESEND.DEV>"), "must be case-insensitive");
assert.ok(!isSandboxSender("Promptly <alerts@joinpromptly.co>"));

// No API key: cannot send at all, and says so.
withEnv({ key: undefined, from: undefined }, () => {
  const state = configState();
  assert.equal(state.hasApiKey, false);
  assert.equal(state.canReachRealUsers, false);
  assert.match(state.blockedReason, /RESEND_API_KEY/);
});

// Key present but no ALERT_FROM_EMAIL — the exact state this outage was in.
// A key alone must NOT count as working.
withEnv({ key: "re_test_key", from: undefined }, () => {
  const state = configState();
  assert.equal(state.hasApiKey, true);
  assert.equal(state.sandboxSender, true);
  assert.equal(state.canReachRealUsers, false,
    "an API key with the default sandbox sender cannot reach real students");
  assert.match(state.blockedReason, /sandbox/i);
});

// Explicitly configured to the sandbox address: same conclusion.
withEnv({ key: "re_test_key", from: "Promptly <onboarding@resend.dev>" }, () => {
  assert.equal(configState().canReachRealUsers, false);
});

// Properly configured on a verified domain.
withEnv({ key: "re_test_key", from: "Promptly <alerts@joinpromptly.co>" }, () => {
  const state = configState();
  assert.equal(state.sandboxSender, false);
  assert.equal(state.canReachRealUsers, true);
  assert.equal(state.blockedReason, null);
});

console.log("Email health tests passed. Sandbox sender is never reported as working.");

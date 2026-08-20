// ADMIN_PIN validation: the highest-risk edge is a misconfigured PIN silently
// disabling protection rather than rejecting cleanly, so every unset/invalid
// shape must fail closed.

const assert = require("node:assert/strict");

function withPin(pin, fn) {
  const prev = process.env.ADMIN_PIN;
  process.env.ADMIN_PIN = pin;
  delete require.cache[require.resolve("../api/admin-stats.js")];
  const { pinMatches } = require("../api/admin-stats.js");
  try {
    fn(pinMatches);
  } finally {
    if (prev === undefined) delete process.env.ADMIN_PIN;
    else process.env.ADMIN_PIN = prev;
  }
}

// Unset ADMIN_PIN: the PIN path must not exist at all, for any input.
withPin(undefined, (pinMatches) => {
  assert.strictEqual(pinMatches("123456"), false, "no ADMIN_PIN configured = PIN path fully disabled");
  assert.strictEqual(pinMatches(""), false);
});

// A correctly configured 6-digit PIN.
withPin("482913", (pinMatches) => {
  assert.strictEqual(pinMatches("482913"), true, "the exact configured PIN must match");
  assert.strictEqual(pinMatches("482914"), false, "a near-miss must not match");
  assert.strictEqual(pinMatches(""), false, "an empty guess must not match");
  assert.strictEqual(pinMatches("482913 "), false, "trailing whitespace on the GUESS must not be forgiven");
});

// Malformed ADMIN_PIN values must disable the path rather than accept
// anything — a blank env var or a stray non-numeric value must fail closed,
// not open.
for (const bad of ["", "   ", "12ab56", "123456789012", "abc", "12"]) {
  withPin(bad, (pinMatches) => {
    assert.strictEqual(pinMatches("482913"), false, `malformed ADMIN_PIN "${bad}" must disable the PIN path entirely`);
  });
}

// The real long ADMIN_SECRET must never be usable as if it were the short PIN
// — the two credentials are deliberately separate.
withPin("482913", (pinMatches) => {
  assert.strictEqual(pinMatches("this-is-the-real-long-admin-secret-value"), false);
});

console.log("Admin PIN tests passed.");

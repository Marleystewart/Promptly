// An adapter that no-ops without credentials must never look like healthy
// coverage. fetchUsaJobs() returns [] when USAJOBS_API_KEY / USAJOBS_EMAIL are
// unset — correct (a missing key must not break the whole refresh) but
// indistinguishable from "no federal roles today", which is how the entire
// government feed sat dead and unnoticed.

const assert = require("node:assert/strict");
const { usaJobsState, readIntegrationHealth } = require("../api/_shared/integration-health");

const original = { key: process.env.USAJOBS_API_KEY, email: process.env.USAJOBS_EMAIL };

function withEnv({ key, email }, fn) {
  if (key === undefined) delete process.env.USAJOBS_API_KEY;
  else process.env.USAJOBS_API_KEY = key;
  if (email === undefined) delete process.env.USAJOBS_EMAIL;
  else process.env.USAJOBS_EMAIL = email;
  try { return fn(); } finally {
    if (original.key === undefined) delete process.env.USAJOBS_API_KEY;
    else process.env.USAJOBS_API_KEY = original.key;
    if (original.email === undefined) delete process.env.USAJOBS_EMAIL;
    else process.env.USAJOBS_EMAIL = original.email;
  }
}

// Neither credential: not configured, and it says why.
withEnv({ key: undefined, email: undefined }, () => {
  const s = usaJobsState();
  assert.equal(s.configured, false);
  assert.match(s.blockedReason, /USAJOBS_API_KEY/);
  assert.equal(readIntegrationHealth().unconfigured.includes("USAJOBS"), true);
});

// A key alone is not enough — USAJOBS requires both, and half-configured must
// not read as working.
withEnv({ key: "k", email: undefined }, () => {
  assert.equal(usaJobsState().configured, false, "a key without the email cannot authenticate");
});
withEnv({ key: undefined, email: "a@b.co" }, () => {
  assert.equal(usaJobsState().configured, false, "an email without the key cannot authenticate");
});

// Both present: configured, nothing to report.
withEnv({ key: "k", email: "a@b.co" }, () => {
  const s = usaJobsState();
  assert.equal(s.configured, true);
  assert.equal(s.blockedReason, null);
  assert.deepEqual(readIntegrationHealth().unconfigured, []);
});

// The registry really does route federal coverage through this one adapter, so
// the banner's claim about what is lost stays true.
assert.ok(usaJobsState().sources >= 1, "expected at least one usajobs source in the registry");

console.log("Integration health tests passed. An unconfigured adapter never reads as healthy.");

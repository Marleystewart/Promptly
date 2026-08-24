// The service worker must not intercept cross-origin requests.
//
// Regression guard for a live auth outage: the worker proxied every GET,
// including the <script src> for the Supabase SDK on cdn.jsdelivr.net. Going
// through the worker re-issues the request as fetch(), which the CSP governs
// under connect-src instead of script-src — and connect-src does not list
// jsdelivr. The request was blocked, the SDK never loaded, and the app quietly
// fell back to "secure accounts are not connected yet".
//
// A cached copy masked this until a cacheName bump cleared it, so the failure
// only appeared for users with an empty cache. Assert the behaviour directly.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "service-worker.js"), "utf8");

const listeners = {};
const sandbox = {
  self: {
    addEventListener: (type, fn) => { listeners[type] = fn; },
    location: { origin: "https://app.joinpromptly.co" },
    skipWaiting() {},
    clients: { claim() {} },
    registration: { showNotification() {} },
  },
  caches: {
    open: async () => ({ addAll: async () => {}, put: async () => {} }),
    keys: async () => [],
    match: async () => undefined,
    delete: async () => true,
  },
  clients: { openWindow() {} },
  fetch: async () => ({ clone: () => ({}), ok: true }),
  URL,
  console,
};
sandbox.self.self = sandbox.self;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

assert.ok(listeners.fetch, "service worker must register a fetch listener");

function dispatch(url, { method = "GET", mode = "no-cors" } = {}) {
  let responded = false;
  listeners.fetch({
    request: { url, method, mode },
    respondWith() { responded = true; },
  });
  return responded;
}

// Cross-origin requests must pass straight through to the browser.
const thirdParty = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js",
  "https://project.supabase.co/auth/v1/token",
  "https://www.google.com/favicon.ico",
];

for (const url of thirdParty) {
  assert.equal(
    dispatch(url), false,
    `service worker must not intercept cross-origin request: ${url}`
  );
}

// Same-origin requests are still cached as before.
assert.equal(
  dispatch("https://app.joinpromptly.co/script.js"), true,
  "same-origin assets must still be handled by the worker"
);
assert.equal(
  dispatch("https://app.joinpromptly.co/", { mode: "navigate" }), true,
  "same-origin navigations must still be handled by the worker"
);

// API GETs can contain account or founder data and must never enter Cache API,
// even when a response carries Cache-Control: no-store.
assert.equal(
  dispatch("https://app.joinpromptly.co/api/admin-stats"), false,
  "same-origin API responses must bypass the service worker"
);

// Non-GET is left alone regardless of origin.
assert.equal(
  dispatch("https://app.joinpromptly.co/api/subscribe", { method: "POST" }), false,
  "non-GET requests must not be intercepted"
);

console.log(`Service worker scope tests passed. ${thirdParty.length} third-party origins pass through.`);

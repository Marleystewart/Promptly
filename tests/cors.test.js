// CORS is what lets the native shell talk to the API at all — and, done wrong,
// what would let any website on the internet call these endpoints with a stolen
// Bearer token. Both directions are asserted here.

const assert = require("node:assert/strict");
const { withCors, isAllowedOrigin } = require("../api/_shared/cors");

function mockRes() {
  return {
    headers: {},
    statusCode: 200,
    ended: false,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    end() { this.ended = true; return this; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

function run(handler, { method = "GET", origin } = {}) {
  const req = { method, headers: origin ? { origin } : {} };
  const res = mockRes();
  handler(req, res);
  return res;
}

let handlerCalls = 0;
const wrapped = withCors((req, res) => {
  handlerCalls += 1;
  return res.status(200).json({ ok: true });
});

// --- The native origins are allowed ---------------------------------------
for (const origin of ["capacitor://localhost", "ionic://localhost", "http://localhost"]) {
  assert.ok(isAllowedOrigin(origin), `${origin} should be allowlisted`);
  const res = run(wrapped, { origin });
  assert.equal(res.getHeader("access-control-allow-origin"), origin,
    `${origin} should be echoed back exactly`);
}

// --- Arbitrary origins are NOT ---------------------------------------------
for (const origin of [
  "https://evil.example",
  "https://app.joinpromptly.co.evil.example", // suffix-confusion attempt
  "capacitor://localhost.evil.example",
  "null",
]) {
  assert.ok(!isAllowedOrigin(origin), `${origin} must not be allowlisted`);
  const res = run(wrapped, { origin });
  assert.equal(res.getHeader("access-control-allow-origin"), undefined,
    `${origin} must not receive an allow-origin header`);
}

// Never wildcard: these endpoints move subscriber data.
const wildcardCheck = run(wrapped, { origin: "capacitor://localhost" });
assert.notEqual(wildcardCheck.getHeader("access-control-allow-origin"), "*",
  "allow-origin must never be a wildcard");

// Cookies are not used anywhere in the API; advertising credential support
// would widen this needlessly.
assert.equal(wildcardCheck.getHeader("access-control-allow-credentials"), undefined,
  "must not send allow-credentials");

// --- Vary: Origin on every response, allowed or not ------------------------
// /api/openings is cached with s-maxage=600. Without Vary, a shared cache could
// serve one origin's CORS response to another.
assert.equal(run(wrapped, { origin: "capacitor://localhost" }).getHeader("vary"), "Origin");
assert.equal(run(wrapped, { origin: "https://evil.example" }).getHeader("vary"), "Origin");
assert.equal(run(wrapped, {}).getHeader("vary"), "Origin", "Vary must be set even with no Origin");

// --- Preflight never reaches real logic ------------------------------------
handlerCalls = 0;
const preflight = run(wrapped, { method: "OPTIONS", origin: "capacitor://localhost" });
assert.equal(preflight.statusCode, 204);
assert.ok(preflight.ended, "preflight must be terminated by the wrapper");
assert.equal(handlerCalls, 0, "preflight must not invoke the wrapped handler (rate limits, token checks)");
assert.ok(preflight.getHeader("access-control-allow-headers").includes("Authorization"),
  "Authorization must be permitted — the app sends Bearer tokens");

const badPreflight = run(wrapped, { method: "OPTIONS", origin: "https://evil.example" });
assert.equal(badPreflight.statusCode, 403);
assert.equal(handlerCalls, 0);

// --- Same-origin web traffic is untouched ----------------------------------
// No Origin header means a same-origin request: it must reach the handler
// normally and gain no CORS headers.
handlerCalls = 0;
const sameOrigin = run(wrapped, {});
assert.equal(handlerCalls, 1, "same-origin requests must still reach the handler");
assert.equal(sameOrigin.getHeader("access-control-allow-origin"), undefined);

// --- Every client-called endpoint is actually wrapped ----------------------
// If a new endpoint the frontend calls is added without withCors, it works on
// the web and fails only inside the native app. Catch that here instead.
const CLIENT_ENDPOINTS = [
  "auth-config", "openings", "send-alert", "send-recap",
  "send-test", "stats", "subscribe", "vapid-public-key",
];

for (const name of CLIENT_ENDPOINTS) {
  const exported = require(`../api/${name}.js`);
  assert.equal(typeof exported, "function", `api/${name}.js must export a handler`);
  assert.equal(exported.name, "corsWrappedHandler",
    `api/${name}.js is called from the frontend but is not wrapped in withCors — it would fail in the native app`);
}

console.log(`CORS tests passed. ${CLIENT_ENDPOINTS.length} client endpoints wrapped.`);

const assert = require("node:assert/strict");
const Module = require("node:module");

let erasureResult = { erased: false };
const realLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "./_shared/erase" && parent?.filename?.endsWith("api/subscribe.js")) {
    return { eraseSubscriber: async () => erasureResult };
  }
  return realLoad(request, parent, isMain);
};
const subscribeHandler = require("../api/subscribe");
Module._load = realLoad;

function response() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    // Real Vercel responses always carry setHeader; the handler is wrapped in
    // withCors, which sets Vary on every request.
    setHeader(key, value) { this.headers[String(key).toLowerCase()] = value; return this; },
    getHeader(key) { return this.headers[String(key).toLowerCase()]; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

(async () => {
  const originalFetch = global.fetch;
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  };
  try {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;

    const unauthorized = response();
    await subscribeHandler({ method: "DELETE", headers: {} }, unauthorized);
    assert.equal(unauthorized.statusCode, 401);

    process.env.SUPABASE_URL = "https://project.supabase.co";
    const missingSecret = response();
    await subscribeHandler({ method: "DELETE", headers: { authorization: "Bearer caller-jwt" } }, missingSecret);
    assert.equal(missingSecret.statusCode, 503);
    assert.match(missingSecret.body.setupRequired, /SUPABASE_SERVICE_ROLE_KEY/);

    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-secret";
    const requests = [];
    global.fetch = async (url, options = {}) => {
      requests.push({ url, options });
      if (url.endsWith("/auth/v1/user")) {
        assert.equal(options.headers.Authorization, "Bearer caller-jwt");
        return {
          ok: true,
          async json() {
            return {
              id: "verified-user-id",
              email: "student@example.com",
              email_confirmed_at: "2026-08-24T00:00:00Z",
            };
          },
        };
      }
      assert.equal(url, "https://project.supabase.co/auth/v1/admin/users/verified-user-id");
      assert.equal(options.method, "DELETE");
      assert.equal(options.headers.Authorization, "Bearer server-secret");
      return { ok: true, async json() { return {}; } };
    };

    const cleanupUnavailable = response();
    await subscribeHandler({ method: "DELETE", headers: { authorization: "Bearer caller-jwt" } }, cleanupUnavailable);
    assert.equal(cleanupUnavailable.statusCode, 502,
      "the auth account must survive when alert-data erasure could not run");
    assert.equal(requests.length, 1,
      "Supabase admin deletion must not run after an incomplete alert-data cleanup");

    erasureResult = { erased: true };
    const deleted = response();
    await subscribeHandler({ method: "DELETE", headers: { authorization: "Bearer caller-jwt" } }, deleted);
    assert.equal(deleted.statusCode, 200);
    assert.equal(deleted.body.ok, true);
    assert.equal(requests.length, 3, "successful deletion authenticates once, then deletes the exact session user");
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  console.log("Secure account deletion tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

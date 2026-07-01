const assert = require("node:assert/strict");
const subscribeHandler = require("../api/subscribe");

function response() {
  return {
    statusCode: null,
    body: null,
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
        return { ok: true, async json() { return { id: "verified-user-id", email: "student@example.com" }; } };
      }
      assert.equal(url, "https://project.supabase.co/auth/v1/admin/users/verified-user-id");
      assert.equal(options.method, "DELETE");
      assert.equal(options.headers.Authorization, "Bearer server-secret");
      return { ok: true, async json() { return {}; } };
    };

    const deleted = response();
    await subscribeHandler({ method: "DELETE", headers: { authorization: "Bearer caller-jwt" } }, deleted);
    assert.equal(deleted.statusCode, 200);
    assert.equal(deleted.body.ok, true);
    assert.equal(requests.length, 2);
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

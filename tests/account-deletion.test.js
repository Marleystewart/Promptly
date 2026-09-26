const assert = require("node:assert/strict");
const subscribeHandler = require("../api/subscribe");

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
      // The profile photo lives in Storage and does not cascade when the auth
      // user is deleted, so deletion removes it explicitly.
      if (url.includes("/storage/v1/object/avatars/")) {
        assert.equal(url, "https://project.supabase.co/storage/v1/object/avatars/verified-user-id/avatar");
        assert.equal(options.method, "DELETE");
        assert.equal(options.headers.Authorization, "Bearer server-secret");
        return { ok: true, async json() { return {}; } };
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
    assert.equal(requests.length, 3, "deletion must not be blocked by the confirmation-policy check");
    // Order matters: after the auth user is gone there is no id left to build
    // the photo's path from, so the photo must go first.
    const avatarAt = requests.findIndex((r) => r.url.includes("/storage/v1/object/avatars/"));
    const userAt = requests.findIndex((r) => r.url.includes("/auth/v1/admin/users/"));
    assert.ok(avatarAt >= 0, "the stored profile photo must be deleted with the account");
    assert.ok(avatarAt < userAt, "the photo must be deleted before the auth user");
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

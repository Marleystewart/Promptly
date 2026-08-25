const assert = require("node:assert/strict");
const { authenticateUser, bearerToken, emailBelongsToUser } = require("../api/_shared/auth-user");

(async () => {
  const originalFetch = global.fetch;
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  };

  try {
    assert.equal(bearerToken({ headers: {} }), "");
    assert.equal(bearerToken({ headers: { authorization: "Bearer caller-jwt" } }), "caller-jwt");
    assert.equal(emailBelongsToUser("STUDENT@example.edu", "student@example.edu"), true);
    assert.equal(emailBelongsToUser("attacker@example.edu", "student@example.edu"), false);

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;

    const missingToken = await authenticateUser({ headers: {} });
    assert.equal(missingToken.status, 401);

    const missingConfig = await authenticateUser({ headers: { authorization: "Bearer caller-jwt" } });
    assert.equal(missingConfig.status, 503);

    process.env.SUPABASE_URL = "https://project.supabase.co/";
    process.env.SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    global.fetch = async (url, options = {}) => {
      assert.equal(url, "https://project.supabase.co/auth/v1/user");
      assert.equal(options.headers.Authorization, "Bearer caller-jwt");
      assert.equal(options.headers.apikey, "publishable-key");
      return {
        ok: true,
        async json() { return { id: "verified-user", email: "Student@Example.edu" }; },
      };
    };

    const verified = await authenticateUser({ headers: { authorization: "Bearer caller-jwt" } });
    assert.equal(verified.ok, true);
    assert.equal(verified.email, "student@example.edu");

    global.fetch = async () => ({ ok: false });
    const rejected = await authenticateUser({ headers: { authorization: "Bearer expired" } });
    assert.equal(rejected.status, 401);
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  console.log("Authenticated user boundary tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

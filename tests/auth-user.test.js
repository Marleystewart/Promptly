const assert = require("node:assert/strict");
const {
  authenticateUser, bearerToken, emailBelongsToUser, isEmailConfirmed,
} = require("../api/_shared/auth-user");

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
    assert.equal(isEmailConfirmed({ email_confirmed_at: "2026-08-24T00:00:00Z" }), true);
    assert.equal(isEmailConfirmed({ confirmed_at: "2026-08-24T00:00:00Z" }), false,
      "phone/legacy confirmation must not stand in for email confirmation");
    assert.equal(isEmailConfirmed({}), false);

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
    let autoConfirm = false;
    let confirmedUser = false;
    global.fetch = async (url, options = {}) => {
      assert.equal(options.headers.apikey, "publishable-key");
      if (url.endsWith("/auth/v1/settings")) {
        assert.equal(options.headers.Authorization, "Bearer publishable-key");
        return {
          ok: true,
          async json() { return { mailer_autoconfirm: autoConfirm }; },
        };
      }
      assert.equal(url, "https://project.supabase.co/auth/v1/user");
      assert.equal(options.headers.Authorization, "Bearer caller-jwt");
      return {
        ok: true,
        async json() {
          return {
            id: "verified-user",
            email: "Student@Example.edu",
            email_confirmed_at: confirmedUser ? "2026-08-24T00:00:00Z" : null,
          };
        },
      };
    };

    const unconfirmed = await authenticateUser({ headers: { authorization: "Bearer caller-jwt" } });
    assert.equal(unconfirmed.status, 403);
    assert.match(unconfirmed.error, /confirm your email/i);

    confirmedUser = true;

    const verified = await authenticateUser({ headers: { authorization: "Bearer caller-jwt" } });
    assert.equal(verified.ok, true);
    assert.equal(verified.email, "student@example.edu");

    autoConfirm = true;
    const unsafePolicy = await authenticateUser({ headers: { authorization: "Bearer caller-jwt" } });
    assert.equal(unsafePolicy.status, 503);
    assert.match(unsafePolicy.error, /confirmation must be enabled/i);

    confirmedUser = false;
    global.fetch = async (url) => {
      assert.equal(url, "https://project.supabase.co/auth/v1/user",
        "deletion-mode authentication must not depend on the confirmation settings endpoint");
      return {
        ok: true,
        async json() { return { id: "unconfirmed-user", email: "student@example.edu" }; },
      };
    };
    const deletionIdentity = await authenticateUser(
      { headers: { authorization: "Bearer caller-jwt" } },
      { requireConfirmedEmail: false }
    );
    assert.equal(deletionIdentity.ok, true, "an authenticated user must still be able to delete their account");

    autoConfirm = false;
    global.fetch = async (url) => url.endsWith("/settings")
      ? { ok: true, async json() { return { mailer_autoconfirm: false }; } }
      : { ok: false };
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

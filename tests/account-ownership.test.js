const assert = require("node:assert/strict");

function response() {
  return {
    statusCode: 0,
    body: null,
    headers: {},
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
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  };

  try {
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    global.fetch = async (url) => {
      if (url.endsWith("/auth/v1/settings")) {
        return { ok: true, async json() { return { mailer_autoconfirm: false }; } };
      }
      assert.equal(url, "https://project.supabase.co/auth/v1/user");
      return {
        ok: true,
        async json() {
          return {
            id: "owner-id",
            email: "owner@example.edu",
            email_confirmed_at: "2026-08-24T00:00:00Z",
          };
        },
      };
    };

    const cases = [
      {
        handler: require("../api/subscribe"),
        body: { profile: { email: "victim@example.edu" } },
      },
      {
        handler: require("../api/send-alert"),
        body: { profile: { email: "victim@example.edu" }, opening: {} },
      },
      {
        handler: require("../api/send-recap"),
        body: { profile: { email: "victim@example.edu" } },
      },
    ];

    for (const testCase of cases) {
      const res = response();
      await testCase.handler({
        method: "POST",
        headers: { authorization: "Bearer owner-token" },
        body: testCase.body,
      }, res);
      assert.equal(res.statusCode, 403, "a session must not operate on a different email address");
      assert.match(res.body.error, /does not belong/i);
    }
  } finally {
    global.fetch = originalFetch;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

  console.log("Account ownership enforcement tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

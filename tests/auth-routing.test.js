const assert = require("node:assert/strict");
const {
  parseOAuthCallback,
  cleanOAuthCallbackUrl,
  establishAuthSession,
  isAccountDeletionConfirmed,
  clearPromptlyClientState,
  createAuthenticatedUserRouter,
} = require("../auth-routing");

assert.equal(isAccountDeletionConfirmed("DELETE"), true);
assert.equal(isAccountDeletionConfirmed("delete"), false);
assert.equal(isAccountDeletionConfirmed(null), false);

{
  let localCleared = 0;
  let sessionCleared = 0;
  clearPromptlyClientState(
    { clear() { localCleared += 1; } },
    { clear() { sessionCleared += 1; } }
  );
  assert.equal(localCleared, 1);
  assert.equal(sessionCleared, 1);
}

function scenario(complete) {
  const events = [];
  const route = createAuthenticatedUserRouter({
    applyUser(user) { events.push(`apply:${user.id}`); },
    isComplete() { return complete; },
    showComplete() { events.push("home"); },
    showIncomplete() { events.push("onboarding:2"); },
  });
  return { events, route };
}

{
  const { events, route } = scenario(true);
  assert.equal(route(null), false, "an initially empty OAuth session should not route");
  assert.equal(route({ id: "oauth-user" }), true, "a delayed SIGNED_IN callback should route");
  assert.deepEqual(events, ["apply:oauth-user", "home"]);
  assert.equal(route({ id: "oauth-user" }), false, "duplicate auth events should not rerun migration");
  assert.deepEqual(events, ["apply:oauth-user", "home"]);
}

{
  const callback = parseOAuthCallback("https://promptly.example/#access_token=secret-access&refresh_token=secret-refresh&expires_in=3600");
  assert.deepEqual(callback, { type: "tokens", accessToken: "secret-access", refreshToken: "secret-refresh" });
  const clean = cleanOAuthCallbackUrl("https://promptly.example/?campaign=summer#access_token=secret-access&refresh_token=secret-refresh&keep=yes");
  assert.equal(clean, "/?campaign=summer#keep=yes");
  assert.doesNotMatch(clean, /secret|access_token|refresh_token/);
}

{
  const callback = parseOAuthCallback("https://promptly.example/callback?code=pkce-code&campaign=summer#details");
  assert.deepEqual(callback, { type: "code", code: "pkce-code" });
  assert.equal(
    cleanOAuthCallbackUrl("https://promptly.example/callback?code=pkce-code&campaign=summer#details"),
    "/callback?campaign=summer#details"
  );
}

async function sessionScenarios() {
  const user = { id: "callback-user" };
  const tokenCalls = [];
  const tokenSession = await establishAuthSession({
    async setSession(value) {
      tokenCalls.push(value);
      return { data: { session: { user } }, error: null };
    },
  }, { type: "tokens", accessToken: "access", refreshToken: "refresh" });
  assert.equal(tokenSession.user, user);
  assert.deepEqual(tokenCalls, [{ access_token: "access", refresh_token: "refresh" }]);
  const routed = [];
  const route = createAuthenticatedUserRouter({
    applyUser(value) { routed.push(`apply:${value.id}`); },
    isComplete() { return false; },
    showComplete() { routed.push("home"); },
    showIncomplete() { routed.push("onboarding:2"); },
  });
  route(tokenSession.user);
  assert.deepEqual(routed, ["apply:callback-user", "onboarding:2"]);

  const codeCalls = [];
  const codeSession = await establishAuthSession({
    async exchangeCodeForSession(code) {
      codeCalls.push(code);
      return { data: { session: { user } }, error: null };
    },
  }, { type: "code", code: "pkce-code" });
  assert.equal(codeSession.user, user);
  assert.deepEqual(codeCalls, ["pkce-code"]);

  let fallbackCalls = 0;
  const fallbackSession = await establishAuthSession({
    async getSession() {
      fallbackCalls += 1;
      return { data: { session: { user } }, error: null };
    },
  }, null);
  assert.equal(fallbackSession.user, user);
  assert.equal(fallbackCalls, 1);
}

{
  const { events, route } = scenario(true);
  route({ id: "existing-user" });
  assert.deepEqual(events, ["apply:existing-user", "home"]);
}

{
  const { events, route } = scenario(false);
  route({ id: "new-user" });
  assert.deepEqual(events, ["apply:new-user", "onboarding:2"]);
  route.reset();
  assert.equal(route({ id: "new-user" }), true, "sign-out should allow a later session to route");
}

sessionScenarios().then(() => {
  console.log("Auth routing tests passed.");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

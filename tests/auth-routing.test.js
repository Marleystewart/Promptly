const assert = require("node:assert/strict");
const { createAuthenticatedUserRouter } = require("../auth-routing");

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

console.log("Auth routing tests passed.");

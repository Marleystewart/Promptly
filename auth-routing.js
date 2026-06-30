(function exposeAuthRouting(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PromptlyAuthRouting = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function createAuthRoutingApi() {
  function createAuthenticatedUserRouter({ applyUser, isComplete, showComplete, showIncomplete }) {
    let routedUserKey = null;

    function routeAuthenticatedUser(user) {
      if (!user) return false;
      const userKey = String(user.id || user.email || "authenticated-user");
      if (userKey === routedUserKey) return false;

      applyUser(user);
      routedUserKey = userKey;
      if (isComplete()) showComplete();
      else showIncomplete();
      return true;
    }

    routeAuthenticatedUser.reset = () => {
      routedUserKey = null;
    };
    return routeAuthenticatedUser;
  }

  return { createAuthenticatedUserRouter };
}));

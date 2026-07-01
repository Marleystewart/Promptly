(function exposeAuthRouting(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PromptlyAuthRouting = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function createAuthRoutingApi() {
  const AUTH_QUERY_PARAMS = ["code", "error", "error_code", "error_description"];
  const AUTH_HASH_PARAMS = [
    "access_token", "refresh_token", "expires_in", "expires_at", "token_type", "type",
    "provider_token", "provider_refresh_token", "error", "error_code", "error_description",
  ];

  function parseOAuthCallback(locationLike) {
    const url = new URL(locationLike.href || String(locationLike), "https://promptly.local");
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    if (accessToken && refreshToken) return { type: "tokens", accessToken, refreshToken };

    const code = url.searchParams.get("code");
    if (code) return { type: "code", code };
    return null;
  }

  function cleanOAuthCallbackUrl(locationLike) {
    const url = new URL(locationLike.href || String(locationLike), "https://promptly.local");
    AUTH_QUERY_PARAMS.forEach((key) => url.searchParams.delete(key));

    const rawHash = url.hash.replace(/^#/, "");
    let cleanHash = rawHash;
    if (rawHash.includes("=") || rawHash.includes("&")) {
      const hash = new URLSearchParams(rawHash);
      AUTH_HASH_PARAMS.forEach((key) => hash.delete(key));
      cleanHash = hash.toString();
    }
    return `${url.pathname}${url.search}${cleanHash ? `#${cleanHash}` : ""}`;
  }

  async function establishAuthSession(auth, callback) {
    let result;
    if (callback?.type === "tokens") {
      result = await auth.setSession({
        access_token: callback.accessToken,
        refresh_token: callback.refreshToken,
      });
    } else if (callback?.type === "code") {
      result = await auth.exchangeCodeForSession(callback.code);
    } else {
      result = await auth.getSession();
    }
    if (result?.error) throw result.error;
    return result?.data?.session || null;
  }

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

  return { parseOAuthCallback, cleanOAuthCallbackUrl, establishAuthSession, createAuthenticatedUserRouter };
}));

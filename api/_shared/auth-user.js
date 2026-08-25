// Verify that a request belongs to a real Supabase account.
//
// Subscriber records are keyed by email, but an email address is not a
// credential. Any route that creates, edits, watches for, or sends alerts for
// an address must derive that address from the caller's authenticated session
// instead of trusting JSON supplied by the browser.

function bearerToken(req) {
  const authorization = String(req.headers?.authorization || "");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function authConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    apiKey: process.env.SUPABASE_PUBLISHABLE_KEY
      || process.env.SUPABASE_ANON_KEY
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || process.env.SUPABASE_SECRET_KEY
      || "",
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function authenticateUser(req) {
  const token = bearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Sign in to continue." };

  const { url, apiKey } = authConfig();
  if (!url || !apiKey) {
    return { ok: false, status: 503, error: "Account verification is not configured." };
  }

  let response;
  try {
    response = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: apiKey },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return { ok: false, status: 503, error: "Account verification is temporarily unavailable." };
  }
  if (!response.ok) return { ok: false, status: 401, error: "Your session is no longer valid. Sign in and try again." };

  const user = await response.json().catch(() => null);
  const email = normalizeEmail(user?.email);
  if (!user?.id || !email) return { ok: false, status: 401, error: "Your account could not be verified." };
  return { ok: true, token, user, email };
}

function emailBelongsToUser(candidate, authenticatedEmail) {
  const requested = normalizeEmail(candidate);
  return !requested || requested === normalizeEmail(authenticatedEmail);
}

module.exports = {
  authenticateUser,
  authConfig,
  bearerToken,
  emailBelongsToUser,
  normalizeEmail,
};

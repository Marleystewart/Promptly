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

// A valid Supabase session proves control of the session, but it proves
// control of the email address only after Supabase has confirmed that address.
function isEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at);
}

// Supabase sets email_confirmed_at implicitly when Confirm Email is disabled,
// so the timestamp alone cannot protect our double opt-in promise. Check the
// live project policy as well and fail closed if it changes or cannot be read.
async function confirmationPolicyIsSafe(url, apiKey) {
  let response;
  try {
    response = await fetch(`${url}/auth/v1/settings`, {
      headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return { ok: false, status: 503, error: "Email verification is temporarily unavailable." };
  }
  if (!response.ok) {
    return { ok: false, status: 503, error: "Email verification is temporarily unavailable." };
  }
  const settings = await response.json().catch(() => null);
  if (settings?.mailer_autoconfirm !== false) {
    return { ok: false, status: 503, error: "Email confirmation must be enabled before alerts can be changed or sent." };
  }
  return { ok: true };
}

async function authenticateUser(req, { requireConfirmedEmail = true } = {}) {
  const token = bearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Sign in to continue." };

  const { url, apiKey } = authConfig();
  if (!url || !apiKey) {
    return { ok: false, status: 503, error: "Account verification is not configured." };
  }

  if (requireConfirmedEmail) {
    const confirmationPolicy = await confirmationPolicyIsSafe(url, apiKey);
    if (!confirmationPolicy.ok) return confirmationPolicy;
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
  if (requireConfirmedEmail && !isEmailConfirmed(user)) {
    return { ok: false, status: 403, error: "Confirm your email before continuing." };
  }
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
  confirmationPolicyIsSafe,
  emailBelongsToUser,
  isEmailConfirmed,
  normalizeEmail,
};

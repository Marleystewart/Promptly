// Cross-origin access for the native shells.
//
// On the web Promptly is served from the same origin as its own functions, so
// none of this applies — same-origin requests never carry an Origin header we
// need to answer. Inside the Capacitor shell the page loads from a local origin
// (capacitor://localhost on iOS, http://localhost on Android), which makes every
// /api call cross-origin. Without these headers the native app can't talk to the
// backend at all.
//
// Deliberately an allowlist, not "*": these endpoints move subscriber data and
// accept Bearer tokens. Reflecting arbitrary origins would let any website call
// them with a stolen token.

const ALLOWED_ORIGINS = new Set([
  "capacitor://localhost", // iOS shell
  "ionic://localhost",     // older iOS shells
  "http://localhost",      // Android shell
]);

// Auth rides in the Authorization header and there are no cookies anywhere in
// the API, so we deliberately do NOT send Access-Control-Allow-Credentials.
const ALLOWED_HEADERS = "Content-Type, Accept, Authorization";
// DELETE is required: /api/subscribe uses it for account deletion, which Apple
// mandates for any app offering account creation (Guideline 5.1.1(v)). Omitting
// it here fails the preflight and breaks deletion on native only.
const ALLOWED_METHODS = "GET, POST, DELETE, OPTIONS";

function isAllowedOrigin(origin) {
  return typeof origin === "string" && ALLOWED_ORIGINS.has(origin);
}

function applyCors(req, res) {
  const origin = req.headers?.origin;

  // Origin is echoed rather than wildcarded, so any shared cache MUST key on it.
  // /api/openings sets s-maxage=600 — without Vary, one origin's response could
  // be served to another.
  res.setHeader("Vary", "Origin");

  if (!isAllowedOrigin(origin)) return false;

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  res.setHeader("Access-Control-Max-Age", "86400");
  return true;
}

// Wraps a handler so it answers preflight and carries CORS headers on the real
// response. Non-allowlisted origins fall through to the handler with no CORS
// headers — the browser then blocks the read, which is the behaviour we want.
function withCors(handler) {
  return function corsWrappedHandler(req, res) {
    const allowed = applyCors(req, res);

    if (req.method === "OPTIONS") {
      // Never let a preflight reach real logic (rate limiters, token checks).
      res.statusCode = allowed ? 204 : 403;
      return res.end();
    }

    return handler(req, res);
  };
}

module.exports = { withCors, applyCors, isAllowedOrigin, ALLOWED_ORIGINS };

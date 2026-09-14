// Apple Push Notification service sender.
//
// Why this exists at all: the browser Web Push API does not work inside the
// Capacitor shell. iOS only exposes Web Push to Safari and to a Home Screen
// PWA — a WKWebView, which is what Capacitor runs, has no PushManager. So the
// native app cannot reuse the VAPID path in alerts.js; it registers an APNs
// device token instead, and this module is what talks to Apple.
//
// Implemented directly rather than with a library, for two reasons. APNs is
// HTTP/2 only and Node's global fetch (undici) speaks HTTP/1.1, so the usual
// client cannot reach it; node:http2 can. And the auth is a short ES256 JWT,
// which node:crypto signs in three lines. Adding a dependency here would buy
// nothing and would widen what ships in a binary we sign.

const http2 = require("node:http2");
const crypto = require("node:crypto");

const PRODUCTION_HOST = "https://api.push.apple.com";
const SANDBOX_HOST = "https://api.sandbox.push.apple.com";

// Apple rejects a provider token older than an hour and rate-limits minting
// them, so one token is reused across sends. Module scope survives between
// invocations on a warm serverless instance and is simply re-minted on a cold
// one, which is the correct behaviour either way.
let cachedToken = null;
let cachedAt = 0;
const TOKEN_TTL_MS = 50 * 60 * 1000;

function base64url(input) {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Vercel's environment variables are single-line, so a pasted .p8 arrives with
// literal backslash-n instead of newlines. A PEM parser rejects that with an
// error that says nothing useful, so repair it here rather than making this a
// deployment mystery.
function readPrivateKey() {
  const raw = process.env.APNS_PRIVATE_KEY;
  if (!raw) return null;
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

function apnsConfig() {
  return {
    keyId: process.env.APNS_KEY_ID || "",
    teamId: process.env.APNS_TEAM_ID || "",
    bundleId: process.env.APNS_BUNDLE_ID || "com.thealmargroup.promptly",
    privateKey: readPrivateKey(),
    // Sandbox is what a Debug build from Xcode registers against. Sending a
    // sandbox token to production returns BadDeviceToken, which looks exactly
    // like an uninstalled app — hence an explicit switch instead of a guess.
    host: process.env.APNS_USE_SANDBOX === "true" ? SANDBOX_HOST : PRODUCTION_HOST,
  };
}

function isConfigured() {
  const { keyId, teamId, privateKey } = apnsConfig();
  return Boolean(keyId && teamId && privateKey);
}

// An APNs device token is binary rendered as hex. Anything else is either a
// client bug or someone probing, and both should stop here rather than at
// Apple. Unlike a web push endpoint there is no URL involved, so there is no
// SSRF surface to guard — the host is ours, fixed, and never client-supplied.
function isValidDeviceToken(token) {
  return typeof token === "string" && /^[0-9a-f]{64,200}$/i.test(token.trim());
}

function providerToken() {
  const { keyId, teamId, privateKey } = apnsConfig();
  if (!keyId || !teamId || !privateKey) return null;
  if (cachedToken && Date.now() - cachedAt < TOKEN_TTL_MS) return cachedToken;

  const header = base64url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const claims = base64url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }));
  // ieee-p1363 is the raw r||s encoding JWS requires. The default DER encoding
  // produces a signature Apple rejects as malformed.
  const signature = crypto.sign("SHA256", Buffer.from(`${header}.${claims}`), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  cachedToken = `${header}.${claims}.${base64url(signature)}`;
  cachedAt = Date.now();
  return cachedToken;
}

// Build the APNs payload from the same shape alerts.js already passes to web
// push, so a caller never has to know which transport it is feeding.
function buildPayload({ title, body, url }) {
  return {
    aps: {
      alert: { title: String(title || "Promptly"), body: String(body || "") },
      sound: "default",
      "content-available": 0,
    },
    // Read by the app when the notification is tapped, to open the posting
    // rather than the app's home screen.
    url: String(url || "/"),
  };
}

// Send one notification. Resolves with { sent } or { sent:false, gone } — a
// `gone` result means the token is permanently dead and the caller should stop
// storing it, mirroring the 404/410 pruning the web push path already does.
function sendApnsNotification(deviceToken, payload) {
  return new Promise((resolve, reject) => {
    const token = String(deviceToken || "").trim();
    if (!isValidDeviceToken(token)) return resolve({ sent: false, gone: true, reason: "malformed-token" });

    const jwt = providerToken();
    if (!jwt) return resolve({ sent: false, setupRequired: "Add APNs key environment variables in Vercel." });

    const { bundleId, host } = apnsConfig();
    const client = http2.connect(host);
    // Without this a lost connection leaves the function hanging until Vercel
    // kills it, which turns one dead token into a failed alert run.
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error("APNs request timed out"));
    }, 10000);

    const finish = (value, error) => {
      clearTimeout(timer);
      client.close();
      if (error) reject(error); else resolve(value);
    };

    client.on("error", (error) => finish(null, error));

    const request = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
    });

    let status = 0;
    let raw = "";
    request.on("response", (headers) => { status = Number(headers[":status"]) || 0; });
    request.on("data", (chunk) => { raw += chunk; });
    request.on("error", (error) => finish(null, error));
    request.on("end", () => {
      if (status === 200) return finish({ sent: true });

      let reason = "";
      try { reason = JSON.parse(raw).reason || ""; } catch {}

      // 410 is Apple saying the app was uninstalled. BadDeviceToken means the
      // token was never valid for this topic and environment. Both are
      // permanent, so both prune; everything else may be transient and must
      // not silently discard a working subscriber's token.
      const gone = status === 410 || reason === "BadDeviceToken" || reason === "Unregistered";

      // ExpiredProviderToken means our own JWT aged out mid-run, not that the
      // subscriber is unreachable. Drop the cache so the next send re-mints.
      if (reason === "ExpiredProviderToken") { cachedToken = null; cachedAt = 0; }

      finish({ sent: false, gone, status, reason });
    });

    request.end(JSON.stringify(payload));
  });
}

module.exports = {
  sendApnsNotification,
  // Exported so the test signs with the real code path. Minting a JWT inside
  // the test would assert only that the test can build a JWT.
  providerToken,
  buildPayload,
  isValidDeviceToken,
  isConfigured,
  apnsConfig,
  PRODUCTION_HOST,
  SANDBOX_HOST,
};

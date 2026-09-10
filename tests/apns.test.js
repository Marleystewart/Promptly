// Native push: the APNs transport the iOS shell needs.
//
// Web Push does not exist inside the app. iOS gives PushManager to Safari and
// to a Home Screen PWA, never to the WKWebView Capacitor runs, so the alert
// path grew a second transport rather than a fallback. These assertions pin
// the parts that fail silently: a malformed token, a JWT Apple would reject,
// and the classification that decides whether a token gets thrown away.

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const apns = require("../api/_shared/apns");

// ── Device tokens ────────────────────────────────────────────────────────
assert.equal(apns.isValidDeviceToken("a".repeat(64)), true, "a 64-char hex token is valid");
assert.equal(apns.isValidDeviceToken("A".repeat(64)), true, "case does not matter");
assert.equal(apns.isValidDeviceToken("z".repeat(64)), false, "non-hex is rejected");
assert.equal(apns.isValidDeviceToken("a".repeat(20)), false, "a short token is rejected");
assert.equal(apns.isValidDeviceToken(""), false, "empty is rejected");
assert.equal(apns.isValidDeviceToken(null), false, "null is rejected");
assert.equal(
  apns.isValidDeviceToken("../../etc/passwd"),
  false,
  "the token is interpolated into the request path, so path characters must never pass"
);

// ── Provider JWT ─────────────────────────────────────────────────────────
// Apple rejects a DER-encoded signature as malformed. This is the single
// easiest thing to get wrong here and it fails with a useless error, so build
// a real token with a real key and verify it the way Apple would.
const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
const pem = privateKey.export({ type: "pkcs8", format: "pem" });

const saved = { ...process.env };
process.env.APNS_KEY_ID = "TESTKEYID1";
process.env.APNS_TEAM_ID = "4QH2Q5C457";
// Vercel stores env vars on one line, so a pasted .p8 arrives escaped.
process.env.APNS_PRIVATE_KEY = pem.replace(/\n/g, "\\n");

assert.equal(apns.isConfigured(), true, "key id, team id and private key are all it takes");
assert.equal(
  apns.apnsConfig().privateKey.includes("\n"),
  true,
  "an escaped one-line .p8 from Vercel is repaired into real newlines"
);
assert.equal(apns.apnsConfig().bundleId, "com.thealmargroup.promptly", "the topic defaults to the registered bundle id");

const jwt = apns.providerToken();
assert.ok(jwt, "a configured module mints a token");

const [h, c, sig] = jwt.split(".");
assert.equal(jwt.split(".").length, 3, "a JWT has three segments");
const decodedHeader = JSON.parse(Buffer.from(h, "base64"));
assert.equal(decodedHeader.alg, "ES256", "APNs only accepts ES256");
assert.equal(decodedHeader.kid, "TESTKEYID1", "the key id identifies which .p8 signed this");
assert.equal(JSON.parse(Buffer.from(c, "base64")).iss, "4QH2Q5C457", "the issuer is the team id");

const rawSignature = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
assert.equal(rawSignature.length, 64, "a P-256 JWS signature is raw r||s, 64 bytes — not DER");
assert.equal(
  crypto.verify("SHA256", Buffer.from(`${h}.${c}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, rawSignature),
  true,
  "the signature verifies against the key that signed it"
);

// ── Payload ──────────────────────────────────────────────────────────────
const payload = apns.buildPayload({ title: "Promptly", body: "Stripe opened.", url: "https://example.com/job" });
assert.equal(payload.aps.alert.title, "Promptly");
assert.equal(payload.aps.alert.body, "Stripe opened.");
assert.equal(payload.url, "https://example.com/job", "the tap target rides alongside, not inside aps");
assert.equal(apns.buildPayload({}).url, "/", "a missing url still produces a valid payload");

// ── Malformed tokens never reach the network ─────────────────────────────
(async () => {
  const result = await apns.sendApnsNotification("not-a-token", payload);
  assert.equal(result.sent, false);
  assert.equal(result.gone, true, "a malformed token is permanently dead, so it prunes rather than retries");

  // ── Fan-out ────────────────────────────────────────────────────────────
  // deliverPush is what the alert run calls. A subscriber with neither address
  // must be skipped, and a native-only subscriber with no APNs key configured
  // must say which configuration is missing rather than blaming the student.
  delete process.env.APNS_KEY_ID;
  delete process.env.APNS_TEAM_ID;
  delete process.env.APNS_PRIVATE_KEY;
  delete process.env.VAPID_PUBLIC_KEY;
  delete process.env.VAPID_PRIVATE_KEY;
  delete require.cache[require.resolve("../api/_shared/alerts")];
  const { deliverPush } = require("../api/_shared/alerts");

  const none = await deliverPush({ email: "a@b.edu" }, { title: "x", body: "y" });
  assert.equal(none.sent, false);
  assert.ok(none.skipped, "no registered address is a skip, not a failure");

  const nativeOnly = await deliverPush(
    { email: "a@b.edu", deviceToken: "a".repeat(64) },
    { title: "x", body: "y" }
  );
  assert.equal(nativeOnly.sent, false);
  assert.match(nativeOnly.setupRequired, /APNs/, "a native subscriber reports the APNs keys as missing, not VAPID");

  Object.assign(process.env, saved);

  // ── Wiring that fails silently if it is missing ────────────────────────
  const subscribeSrc = fs.readFileSync(path.join(ROOT, "api/subscribe.js"), "utf8");
  assert.match(subscribeSrc, /register-device/, "the app needs somewhere to hand its token");
  assert.match(subscribeSrc, /unregister-device/, "and a way to give it back");

  // Registration must sit AFTER authentication. An unauthenticated caller able
  // to attach a device to any address would be able to receive that student's
  // alerts on their own phone.
  assert.ok(
    subscribeSrc.indexOf("const auth = await authenticateUser(req)") <
      subscribeSrc.indexOf('body.action === "register-device"'),
    "device registration must be behind authentication"
  );

  // The token arrives at the AppDelegate, not at Capacitor. Miss these and the
  // whole feature is installed, permitted, and inert.
  const appDelegate = fs.readFileSync(path.join(ROOT, "ios/App/App/AppDelegate.swift"), "utf8");
  assert.match(appDelegate, /didRegisterForRemoteNotificationsWithDeviceToken/,
    "AppDelegate must forward the device token to Capacitor");
  assert.match(appDelegate, /capacitorDidFailToRegisterForRemoteNotifications/,
    "and must forward the failure, so a refusal is visible");

  // The web path must survive: the browser app is still most of the users.
  const clientSrc = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
  assert.match(clientSrc, /isNativeShell\(\)/, "the client picks a transport rather than assuming one");
  assert.match(clientSrc, /pushManager\.subscribe/, "web push is untouched");

  console.log("APNs tests passed. Tokens are hex-only, the JWT is raw-ES256, and a dead token prunes.");
})();

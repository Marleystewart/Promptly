// iOS signing and the push entitlement.
//
// These are settings that fail late and confusingly. A missing DEVELOPMENT_TEAM
// stops a build only when someone tries to run on a device. A missing
// aps-environment entitlement is worse: the app builds, installs, asks for
// permission, and gets a token that Apple will never deliver to.
//
// The Debug/Release split is the trap worth pinning. A development build
// registers against the APNs sandbox and a distribution build against
// production, and a token from one is rejected by the other with
// BadDeviceToken — which our own code correctly treats as "app uninstalled"
// and prunes. Getting this backwards looks exactly like a dead device.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const TEAM_ID = "4QH2Q5C457";
const IOS = path.join(ROOT, "ios/App");

const pbxproj = fs.readFileSync(path.join(IOS, "App.xcodeproj/project.pbxproj"), "utf8");

// Both configurations, not just one. Setting the team on Debug alone is the
// easy mistake and it only surfaces at archive time.
const teamMatches = pbxproj.match(new RegExp(`DEVELOPMENT_TEAM = ${TEAM_ID};`, "g")) || [];
assert.equal(teamMatches.length, 2, "DEVELOPMENT_TEAM must be set on both Debug and Release");

assert.match(pbxproj, /CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements;/,
  "Debug must sign with the development entitlements");
assert.match(pbxproj, /CODE_SIGN_ENTITLEMENTS = App\/AppRelease\.entitlements;/,
  "Release must sign with the production entitlements");

const styleMatches = pbxproj.match(/CODE_SIGN_STYLE = Automatic;/g) || [];
assert.equal(styleMatches.length, 2, "both configurations stay on automatic signing");

// The bundle id has to match the App ID that carries the Push capability, or
// the provisioning profile will not include it.
const bundleMatches = pbxproj.match(/PRODUCT_BUNDLE_IDENTIFIER = com\.thealmargroup\.promptly;/g) || [];
assert.equal(bundleMatches.length, 2, "both configurations use the registered bundle id");

// A corrupt pbxproj opens as an empty project in Xcode with no error worth
// reading, so validate it as the plist it is.
try {
  execFileSync("plutil", ["-lint", path.join(IOS, "App.xcodeproj/project.pbxproj")], { stdio: "pipe" });
} catch {
  assert.fail("project.pbxproj is not a valid plist");
}

// ── Entitlements ─────────────────────────────────────────────────────────
function apsEnvironment(file) {
  const xml = fs.readFileSync(path.join(IOS, "App", file), "utf8");
  const match = xml.match(/<key>aps-environment<\/key>\s*<string>([a-z]+)<\/string>/);
  return match ? match[1] : null;
}

assert.equal(apsEnvironment("App.entitlements"), "development",
  "a Debug build registers against the APNs sandbox");
assert.equal(apsEnvironment("AppRelease.entitlements"), "production",
  "TestFlight and the App Store both use production APNs");

for (const file of ["App.entitlements", "AppRelease.entitlements"]) {
  try {
    execFileSync("plutil", ["-lint", path.join(IOS, "App", file)], { stdio: "pipe" });
  } catch {
    assert.fail(`${file} is not a valid plist`);
  }
}

// The server side of the same split. If this drifts, alerts are silently
// dropped for every native user and the token is thrown away as if dead.
const docs = fs.readFileSync(path.join(ROOT, "docs/NATIVE-PUSH.md"), "utf8");
assert.match(docs, /APNS_USE_SANDBOX/, "the sandbox switch has to be documented, not folklore");

console.log("iOS signing tests passed. Team set on both configs; sandbox and production entitlements do not cross.");

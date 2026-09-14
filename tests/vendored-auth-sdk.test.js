// The auth SDK must be servable from our own origin.
//
// Regression guard for a real logout bug. The Supabase SDK was fetched from
// cdn.jsdelivr.net on every cold start, and a failed fetch took the "accounts
// are not connected" branch — visually identical to being signed out. On iOS,
// swiping a PWA away kills the process, so reopening is a cold boot and the OS
// often resumes before the network does. Cam was logged out every time he
// closed the app, while his session sat untouched in localStorage.
//
// Three things have to hold together, and each fails silently on its own: the
// vendored file must exist and actually define the global, the service worker
// must precache it so a cold start with no network still has it, and the
// loader must try local BEFORE the CDN.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sdkPath = path.join(root, "assets", "vendor", "supabase.min.js");

// 1. It exists, and it is the real bundle — not an error page saved as .js,
//    which would still "load" and still leave createClient undefined.
assert.ok(fs.existsSync(sdkPath), "assets/vendor/supabase.min.js is missing — auth cannot load offline");
const sdk = fs.readFileSync(sdkPath, "utf8");
assert.ok(sdk.length > 50000, "vendored SDK is implausibly small — check the download");

const sandbox = { console, setTimeout, clearTimeout, fetch: () => {}, Headers: class {}, AbortController: class { abort() {} } };
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(sdk, sandbox);
assert.equal(typeof sandbox.supabase?.createClient, "function", "vendored SDK does not define supabase.createClient");

// 2. The service worker precaches it. Without this the file exists on the
//    server and is still unreachable on a cold offline start, which is the
//    exact case this fix is for.
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
assert.ok(
  worker.includes("/assets/vendor/supabase.min.js"),
  "service worker app shell does not precache the vendored SDK",
);

// 3. Local is tried before the CDN. If that order flips, everything above
//    still passes while every cold start goes back over the network.
const client = fs.readFileSync(path.join(root, "script.js"), "utf8");
const localAt = client.indexOf("SUPABASE_SDK_LOCAL");
const cdnAt = client.indexOf("SUPABASE_SDK_CDN");
assert.ok(localAt !== -1 && cdnAt !== -1, "SDK source constants are missing");
assert.ok(localAt < cdnAt, "the CDN is declared before the local copy — check the load order");
assert.ok(
  /loadScriptOnce\(SUPABASE_SDK_LOCAL\)[\s\S]{0,200}loadScriptOnce\(SUPABASE_SDK_CDN\)/.test(client),
  "loadSupabaseSdk does not try the local copy before the CDN",
);

// 4. A stored session is detectable WITHOUT the SDK. This is what lets the app
//    tell "signed out" apart from "auth failed to load"; losing it brings the
//    sign-in screen back on every flaky cold start.
assert.ok(client.includes("function hasStoredAuthSession"), "hasStoredAuthSession is gone");
assert.ok(
  /\/\^sb-\.\+-auth-token\$\//.test(client),
  "hasStoredAuthSession no longer matches Supabase's persisted token key",
);

console.log("Vendored auth SDK tests passed. Same-origin, precached, tried first.");

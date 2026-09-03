// No server secret may reach the browser — checked, not assumed.
//
// Promptly's repo is PUBLIC, and the native bundle is a plain file copy, so
// anything that lands in a client file is exposed twice over. A key committed
// once stays in the git history forever, even after it is deleted.
//
// This ran clean the first time. It exists so it stays that way: a secret is
// most likely to be pasted into a client file by someone debugging at speed,
// which is exactly when nobody re-runs an audit.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

// Everything the browser can fetch. admin.html and health.html are included:
// they are not in the native bundle, but they are served on the public web.
const CLIENT_FILES = [
  "index.html", "how-it-works.html", "privacy.html", "terms.html",
  "admin.html", "health.html", "manifest.json", "service-worker.js",
  "script.js", "assistant.js", "watchlist.js", "monitored.js", "geo.js",
  "auth-routing.js", "student-email.js", "listing-state.js", "styles.css",
];

// Server-only. SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY
// and SUPABASE_URL are deliberately absent — those are meant to be public and
// are served to the client by /api/auth-config and /api/vapid-public-key.
const SERVER_ONLY = [
  "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "VAPID_PRIVATE_KEY",
  "RESEND_API_KEY", "ADMIN_SECRET", "CRON_SECRET", "ADMIN_PIN",
  "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN", "USAJOBS_API_KEY",
  "SLIDES_EDIT_KEY", "REPORT_TO_EMAIL",
];

// Shapes, so a pasted VALUE is caught even when the variable name is not there.
const SECRET_SHAPES = [
  [/\bre_[A-Za-z0-9]{20,}/, "a Resend API key"],
  [/\bsk_(?:live|test)_[A-Za-z0-9]{10,}/, "a secret key"],
  [/\bsb_secret_[A-Za-z0-9_-]{10,}/, "a Supabase secret key"],
  [/"service_role"/, "a service-role JWT claim"],
  [/\bAIza[A-Za-z0-9_-]{35}\b/, "a Google API key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "a private key"],
];

for (const file of CLIENT_FILES) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, "utf8");

  // Match a name being ASSIGNED a value, not merely mentioned. admin.html
  // legitimately says "the ADMIN_SECRET you set in Vercel" in its help text —
  // naming the variable an operator must paste is not leaking it, and flagging
  // that would make this check cry wolf until someone disabled it.
  for (const name of SERVER_ONLY) {
    const assigned = new RegExp(`${name}\\s*[:=]\\s*["'\`]?[\\w.-]`);
    assert.doesNotMatch(text, assigned,
      `${file} appears to assign a value to ${name}, which is server-only and must never reach the browser`);
  }
  for (const [shape, what] of SECRET_SHAPES) {
    assert.doesNotMatch(text, shape, `${file} appears to contain ${what}`);
  }
  // process.env does not exist in a browser, so its presence in a client file
  // means either a leaked value or code that silently does nothing.
  assert.ok(!/process\s*\.\s*env/.test(text),
    `${file} reads process.env, which is undefined in a browser`);
}

// The native bundle must stay a plain copy. If build-web.js ever starts
// substituting values into files, everything above stops being sufficient.
{
  const build = fs.readFileSync(path.join(ROOT, "scripts/build-web.js"), "utf8");
  assert.ok(!/process\s*\.\s*env/.test(build),
    "build-web.js must not inline environment values into the shipped bundle");
}

// The admin dashboards must stay out of the app binary. A PIN-locked internal
// screen inside a shipped app is needless attack surface and invites App Store
// questions about hidden features.
{
  const build = fs.readFileSync(path.join(ROOT, "scripts/build-web.js"), "utf8");
  const list = build.match(/const WEB_FILES = \[[\s\S]*?\];/)[0];
  for (const internal of ["admin.html", "health.html"]) {
    assert.ok(!list.includes(internal), `${internal} must not ship inside the native bundle`);
  }
}

console.log(`No-client-secrets tests passed. ${CLIENT_FILES.length} client files checked.`);

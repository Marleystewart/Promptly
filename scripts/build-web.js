#!/usr/bin/env node
// Stages the web assets into www/ for Capacitor's webDir.
//
// On the web, Vercel serves the repo root directly, so there is no build step
// and this script is not involved. The native shell is different: it bundles a
// folder, and that folder must contain ONLY web assets — shipping api/, tests/,
// scripts/ or node_modules/ into an app binary would be both broken and unsafe.
//
// Anything missing from WEB_FILES is simply absent on device, which usually
// shows up as a blank screen rather than an error. tests/build-web.test.js
// asserts this list against the repo so it cannot drift silently.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "www");

// The student-facing app only. Deliberately excluded:
//   admin.html, health.html  — internal dashboards; shipping a PIN-locked admin
//                              screen inside the binary is needless attack
//                              surface and invites App Store questions about
//                              hidden/incomplete features.
//   content/                 — slide/deck tooling for marketing, not the app.
const WEB_FILES = [
  "index.html",
  "how-it-works.html",
  "privacy.html",
  "terms.html",
  "manifest.json",
  "service-worker.js",
  "icon.svg",
  "styles.css",
  "script.js",
  "assistant.js",
  "auth-routing.js",
  "geo.js",
  "student-email.js",
  "listing-state.js",
  "monitored.js",
  "watchlist.js",
];

const WEB_DIRS = ["assets"];

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const missing = [];
  for (const file of WEB_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) {
      missing.push(file);
      continue;
    }
    fs.copyFileSync(src, path.join(OUT, file));
  }

  for (const dir of WEB_DIRS) {
    const src = path.join(ROOT, dir);
    if (!fs.existsSync(src)) {
      missing.push(`${dir}/`);
      continue;
    }
    copyDir(src, path.join(OUT, dir));
  }

  if (missing.length) {
    console.error(`build-web: missing from repo: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`build-web: staged ${WEB_FILES.length} files + ${WEB_DIRS.length} dir(s) into www/`);
}

if (require.main === module) build();

module.exports = { WEB_FILES, WEB_DIRS, build, OUT, ROOT };

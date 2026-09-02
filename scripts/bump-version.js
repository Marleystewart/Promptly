#!/usr/bin/env node
// Bump the cache-busting version on every asset, in one place.
//
// Promptly is a static site with no bundler, so each <script>/<link> carries its
// own ?v= query string. Those pins used to be edited by hand and drifted apart
// immediately — which is not a tidiness problem, it ships bugs:
//
//   • A new script.js reading `oauthCallback.linkType` was nearly shipped
//     against a cached auth-routing.js from July that never set it.
//   • The Blackstone card kept rebuilding from a cached watchlist.js while the
//     corrected file sat on disk.
//   • privacy.html, terms.html and how-it-works.html sat on a July styles.css,
//     so an entire mobile redesign never reached them at all.
//
// One version for everything. Bumping invalidates assets that did not change,
// which costs a few KB on the next load and removes a whole class of bug.
//
// Usage:
//   node scripts/bump-version.js            # today's date, next free letter
//   node scripts/bump-version.js 20260902k  # an explicit version
//   node scripts/bump-version.js --check    # exit 1 if versions disagree

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HTML = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"));
const SW = path.join(ROOT, "service-worker.js");
const VERSION_RE = /\?v=([0-9a-z]+)/g;
const CACHE_RE = /const cacheName = "opening-([0-9a-z]+)"/;

function currentVersions() {
  const found = new Map();
  for (const file of HTML) {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const [, version] of text.matchAll(VERSION_RE)) {
      if (!found.has(version)) found.set(version, new Set());
      found.get(version).add(file);
    }
  }
  return found;
}

function cacheVersion() {
  const match = fs.readFileSync(SW, "utf8").match(CACHE_RE);
  return match ? match[1] : null;
}

// "20260902" + the letter AFTER the highest one used today. Moving forward
// rather than filling the first gap keeps versions readable in a diff: going
// back to "a" after "i" looks like a revert.
function nextVersion(existing) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const used = [...existing].filter((v) => v.startsWith(today)).map((v) => v.slice(8));
  const highest = used.sort().pop() || "";
  const next = highest ? String.fromCharCode(highest.charCodeAt(0) + 1) : "a";
  if (next > "z") throw new Error("26 versions in one day — pass an explicit version instead.");
  return `${today}${next}`;
}

function write(version) {
  let assets = 0;
  for (const file of HTML) {
    const target = path.join(ROOT, file);
    const text = fs.readFileSync(target, "utf8");
    const next = text.replace(VERSION_RE, () => {
      assets += 1;
      return `?v=${version}`;
    });
    if (next !== text) fs.writeFileSync(target, next);
  }
  const sw = fs.readFileSync(SW, "utf8");
  fs.writeFileSync(SW, sw.replace(CACHE_RE, `const cacheName = "opening-${version}"`));
  return assets;
}

const arg = process.argv[2];

if (arg === "--check") {
  const versions = currentVersions();
  const cache = cacheVersion();
  const problems = [];
  if (versions.size > 1) {
    problems.push(`Asset versions disagree:\n${[...versions]
      .map(([v, files]) => `  ?v=${v}  ${[...files].join(", ")}`)
      .join("\n")}`);
  }
  const only = [...versions.keys()][0];
  if (only && cache !== only) {
    problems.push(`Service worker cacheName is "opening-${cache}" but assets are ?v=${only}.`);
  }
  if (problems.length) {
    console.error(`${problems.join("\n\n")}\n\nRun: node scripts/bump-version.js`);
    process.exit(1);
  }
  console.log(`Asset version in sync: ${only} (service worker opening-${only}).`);
  process.exit(0);
}

const version = arg || nextVersion(currentVersions().keys());
if (!/^[0-9a-z]+$/.test(version)) {
  console.error(`Invalid version "${version}" — use lowercase letters and digits.`);
  process.exit(1);
}
const count = write(version);
console.log(`Bumped ${count} asset reference(s) across ${HTML.length} page(s) to ?v=${version}`);
console.log(`Service worker cache is now opening-${version}`);

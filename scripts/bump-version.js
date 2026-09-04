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
// Bump on `main`, AFTER merging — not on a feature branch.
//
// One shared version means every bump rewrites the same six files, so two
// branches that both bump conflict by construction, on a version number rather
// than on any real disagreement. This warns when it can tell you are not on
// main; --force skips the warning for the rare case you mean it.
//
// Usage:
//   node scripts/bump-version.js            # today's date, next letter
//   node scripts/bump-version.js 20260903h  # an explicit version
//   node scripts/bump-version.js --check    # exit 1 if versions disagree
//   node scripts/bump-version.js --force    # bump anyway, off main

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

// Best-effort: no git, a detached HEAD, or a non-repo checkout all just skip
// the warning rather than blocking a legitimate bump.
function currentBranch() {
  try {
    return require("child_process")
      .execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch {
    return null;
  }
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const arg = args.find((a) => a !== "--force");

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

const branch = currentBranch();
if (!force && branch && branch !== "main" && branch !== "HEAD") {
  console.error(
    `You are on "${branch}", not main.\n\n` +
    `Bumping here rewrites six files that every other branch also rewrites, so\n` +
    `this will conflict with any other open PR on a version number rather than\n` +
    `on real work. Merge first, then bump on main:\n\n` +
    `  git checkout main && git pull && npm run bump && npm test && git push\n\n` +
    `If you really mean to bump here (resolving an existing conflict, say):\n` +
    `  node scripts/bump-version.js --force\n`
  );
  process.exit(1);
}

const version = arg || nextVersion(currentVersions().keys());
if (!/^[0-9a-z]+$/.test(version)) {
  console.error(`Invalid version "${version}" — use lowercase letters and digits.`);
  process.exit(1);
}
const count = write(version);
console.log(`Bumped ${count} asset reference(s) across ${HTML.length} page(s) to ?v=${version}`);
console.log(`Service worker cache is now opening-${version}`);

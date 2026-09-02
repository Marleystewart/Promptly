// Every asset must carry the SAME cache-busting version, and the service
// worker's cache name must match it.
//
// Each page used to pin its own ?v= per file, edited by hand. They drifted
// apart immediately, and the drift shipped bugs rather than untidiness:
//
//   • privacy.html, terms.html and how-it-works.html sat on styles.css from
//     29 July, so an entire mobile redesign never reached those pages.
//   • A new script.js reading `oauthCallback.linkType` was nearly shipped
//     against a cached auth-routing.js that never set it.
//   • The Blackstone card kept rebuilding from a cached watchlist.js while the
//     corrected file sat on disk.
//
// Each of those is invisible locally — a hard refresh hides all of them — and
// only affects users who already have the old file. This test is the check that
// the house rule "bump the cache-bust" was actually followed.

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

const versions = new Map();
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"))) {
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const [, version] of text.matchAll(/\?v=([0-9a-z]+)/g)) {
    if (!versions.has(version)) versions.set(version, new Set());
    versions.get(version).add(file);
  }
}

assert.ok(versions.size > 0, "no versioned assets found — did the ?v= convention change?");
assert.equal(
  versions.size,
  1,
  `Assets carry ${versions.size} different cache-busting versions, so some pages will keep ` +
  `serving stale files:\n` +
  [...versions].map(([v, files]) => `  ?v=${v}  ${[...files].join(", ")}`).join("\n") +
  `\n\nRun: node scripts/bump-version.js`
);

const version = [...versions.keys()][0];
const sw = fs.readFileSync(path.join(ROOT, "service-worker.js"), "utf8");
const cache = sw.match(/const cacheName = "opening-([0-9a-z]+)"/);
assert.ok(cache, "service worker cacheName not found — did it get renamed?");
assert.equal(
  cache[1],
  version,
  `Service worker caches as "opening-${cache[1]}" but assets are ?v=${version}. ` +
  `A stale worker keeps serving the previous files to returning users.\n` +
  `Run: node scripts/bump-version.js`
);

// The bump script is the mechanism that keeps the above true, so it has to work.
const check = execFileSync("node", [path.join(ROOT, "scripts", "bump-version.js"), "--check"], {
  encoding: "utf8",
});
assert.match(check, /in sync/, "bump-version.js --check should agree that versions are in sync");

console.log(`Asset version tests passed. 1 version (${version}) across all pages and the worker.`);

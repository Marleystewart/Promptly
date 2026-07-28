// monitored.js must stay in sync with the source registry.
//
// The app relies on this list to decide whether it can honestly promise "we'll
// alert you when this opens". If the registry gains a source and this file
// isn't regenerated, the app under-promises; if a source is removed and this
// isn't regenerated, the app promises an alert it can no longer deliver. The
// second case is a trust bug, so it fails the build.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { SOURCES } = require("../api/_shared/sources");

const file = path.join(__dirname, "..", "monitored.js");
assert.ok(fs.existsSync(file), "monitored.js is missing — run: node scripts/generate-monitored.js");

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(file, "utf8"), sandbox);
// Array.from: the value is built inside the vm realm, so it carries that
// realm's Array.prototype and strict deepEqual would reject it on prototype
// identity alone, even with identical contents.
const listed = Array.from(sandbox.window.MONITORED_COMPANIES || []);

assert.ok(Array.isArray(sandbox.window.MONITORED_COMPANIES), "monitored.js must set window.MONITORED_COMPANIES to an array");

const expected = [...new Set(SOURCES.map((s) => s.company.trim()))].sort((a, b) => a.localeCompare(b));
assert.deepEqual(
  listed,
  expected,
  "monitored.js is out of date — run: node scripts/generate-monitored.js"
);

// The public /how-it-works page publishes these counts, so they must be the
// registry's real numbers — not a figure someone typed into the HTML once.
const coverage = sandbox.window.PROMPTLY_COVERAGE;
assert.ok(coverage, "monitored.js must set window.PROMPTLY_COVERAGE");
assert.equal(coverage.sources, SOURCES.length, "PROMPTLY_COVERAGE.sources is stale");
assert.equal(coverage.companies, expected.length, "PROMPTLY_COVERAGE.companies is stale");

const platforms = {};
const fields = {};
for (const s of SOURCES) {
  platforms[s.ats] = (platforms[s.ats] || 0) + 1;
  fields[s.field] = (fields[s.field] || 0) + 1;
}
assert.deepEqual({ ...coverage.byPlatform }, platforms, "PROMPTLY_COVERAGE.byPlatform is stale");
assert.deepEqual({ ...coverage.byField }, fields, "PROMPTLY_COVERAGE.byField is stale");

console.log(`Monitored-company list in sync. ${listed.length} companies with a live feed.`);

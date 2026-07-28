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

console.log(`Monitored-company list in sync. ${listed.length} companies with a live feed.`);

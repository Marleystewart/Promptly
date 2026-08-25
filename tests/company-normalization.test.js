// normalizeCompanyName() collapses spelling variants so a curated card spelled
// differently from the registry isn't wrongly shown as "we can't read their
// feed". It does that by stripping suffix words (group, partners, management,
// company, …), which is aggressive on purpose.
//
// The risk it creates: if two GENUINELY DIFFERENT employers ever normalize to
// the same key and one of them is monitored, the other inherits "we can read
// this feed" — and Promptly promises an alert it cannot deliver. That is a
// trust failure, not a cosmetic bug.
//
// So this pins the exact set of collisions. Every one below is the same firm
// spelled two ways, which is the intended behaviour. A NEW collision fails the
// build so a human decides which kind it is.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

// Pull the real implementation out of script.js rather than copying the regex,
// so this test cannot drift away from what ships.
const source = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const match = source.match(/function normalizeCompanyName\(name\) \{[\s\S]*?\n\}/);
assert.ok(match, "normalizeCompanyName not found in script.js — did it get renamed?");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${match[0]}; this.fn = normalizeCompanyName;`, sandbox);
const normalizeCompanyName = sandbox.fn;

// Sanity: the variants the fix exists to solve must actually collapse.
assert.equal(normalizeCompanyName("J.P. Morgan"), normalizeCompanyName("JPMorgan"));
assert.equal(normalizeCompanyName("Moelis & Company"), normalizeCompanyName("Moelis"));
assert.equal(normalizeCompanyName("AQR Capital Management"), normalizeCompanyName("AQR Capital"));
assert.equal(normalizeCompanyName("D. E. Shaw"), normalizeCompanyName("D.E. Shaw"));

// …and clearly different employers must NOT.
assert.notEqual(normalizeCompanyName("Morgan Stanley"), normalizeCompanyName("J.P. Morgan"));
assert.notEqual(normalizeCompanyName("Capital One"), normalizeCompanyName("AQR Capital"));
assert.notEqual(normalizeCompanyName("Blackstone"), normalizeCompanyName("BlackRock"));
assert.notEqual(normalizeCompanyName("Point72"), normalizeCompanyName("Point B"));

// Gather every company name the app knows about.
const names = new Set();

const monitoredSandbox = { window: {} };
vm.createContext(monitoredSandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "monitored.js"), "utf8"), monitoredSandbox);
const monitored = Array.from(monitoredSandbox.window.MONITORED_COMPANIES || []);
monitored.forEach((n) => names.add(n));

const { SOURCES } = require("../api/_shared/sources.js");
SOURCES.forEach((s) => names.add(s.company));

const watchlistSandbox = { window: {} };
vm.createContext(watchlistSandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "watchlist.js"), "utf8"), watchlistSandbox);
Object.keys(watchlistSandbox.window.COMPANY_DOMAINS || {}).forEach((n) => names.add(n));

const byKey = new Map();
for (const name of names) {
  const key = normalizeCompanyName(name);
  if (!byKey.has(key)) byKey.set(key, new Set());
  byKey.get(key).add(name);
}

const collisions = [...byKey.entries()]
  .filter(([, set]) => set.size > 1)
  .map(([key]) => key)
  .sort();

// Reviewed 24 Aug 2026: each of these is one firm written two ways, so
// collapsing them is correct and is the whole point of the normalizer.
const KNOWN_SAFE = ["aqrcapital", "deshaw", "jpmorgan", "moelis", "nvidia"].sort();

assert.deepEqual(
  collisions,
  KNOWN_SAFE,
  `New company-name collision(s) detected.\n` +
  `Collapsing two names is only safe when they are the SAME employer.\n` +
  `Check each new key below: if the names are different companies, the ` +
  `unmonitored one will falsely claim Promptly can read its feed.\n` +
  `Found: ${JSON.stringify(collisions)}`
);

// No empty keys — a name that normalizes to "" would match every other empty one.
for (const [key, set] of byKey) {
  assert.notEqual(key, "", `these names normalize to an empty key: ${[...set].join(", ")}`);
}

console.log(`Company normalization tests passed. ${names.size} names, ${collisions.length} reviewed collisions.`);

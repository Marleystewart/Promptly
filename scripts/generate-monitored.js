// Regenerates monitored.js — the list of companies Promptly genuinely has an
// automated feed for.
//
// Why this exists: the app shows "Awaiting the 2027 posting. Promptly will
// alert you the moment it opens" on placeholder cards. That sentence is only
// true for companies in SOURCES. For a firm with no machine-readable job board
// (McKinsey, Bain, BCG, Apple…) it is a promise we cannot keep, so the UI has
// to be able to tell the two apart.
//
// tests/monitored.test.js fails if this file drifts from SOURCES, so it can't
// silently go stale after someone edits the registry.
//
// Usage: node scripts/generate-monitored.js

const fs = require("fs");
const path = require("path");
const { SOURCES } = require("../api/_shared/sources");

const names = [...new Set(SOURCES.map((s) => s.company.trim()))].sort((a, b) =>
  a.localeCompare(b)
);

// Coverage breakdown for the public "How Promptly works" page. Generated from
// the same registry so the numbers on that page can never drift from reality.
const byPlatform = {};
const byField = {};
for (const s of SOURCES) {
  byPlatform[s.ats] = (byPlatform[s.ats] || 0) + 1;
  byField[s.field] = (byField[s.field] || 0) + 1;
}

const file = `// GENERATED FILE — do not edit by hand.
// Run \`node scripts/generate-monitored.js\` after changing api/_shared/sources.js.
//
// Companies Promptly pulls automatically from the employer's own job system.
// The app uses this to avoid promising an alert for an employer whose postings
// we cannot actually read, and /how-it-works publishes these counts so the
// public numbers are always the real ones.
window.MONITORED_COMPANIES = ${JSON.stringify(names, null, 2)};

window.PROMPTLY_COVERAGE = ${JSON.stringify(
  { sources: SOURCES.length, companies: names.length, byPlatform, byField },
  null,
  2
)};
`;

fs.writeFileSync(path.join(__dirname, "..", "monitored.js"), file);

// index.html's meta description / share-preview text quotes the same count.
// Those are static tags (search engines and link unfurlers read the raw HTML,
// so they can't be filled in by script.js at runtime), which is exactly how
// they silently drifted to a stale "126 employers monitored" while the real
// registry nearly doubled. Rewrite them here so the public number is
// regenerated from SOURCES like everything else.
const indexPath = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(indexPath, "utf8");
const before = html;
html = html.replace(/\b\d+ employers monitored\b/g, `${names.length} employers monitored`);
if (html !== before) {
  fs.writeFileSync(indexPath, html);
  console.log(`index.html meta updated — "${names.length} employers monitored".`);
}

console.log(`monitored.js written — ${names.length} monitored companies.`);

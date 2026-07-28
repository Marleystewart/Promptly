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

const file = `// GENERATED FILE — do not edit by hand.
// Run \`node scripts/generate-monitored.js\` after changing api/_shared/sources.js.
//
// Companies Promptly pulls automatically from the employer's own job system.
// The app uses this to avoid promising an alert for an employer whose postings
// we cannot actually read.
window.MONITORED_COMPANIES = ${JSON.stringify(names, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, "..", "monitored.js"), file);
console.log(`monitored.js written — ${names.length} monitored companies.`);

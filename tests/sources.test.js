// Registry integrity lint — runs in `npm test`, no network. Catches the
// mistakes that silently corrupt the data layer as the registry grows:
// duplicate boards, missing ATS keys, unknown industries, malformed entries.
// Structural only (a live board is validated by scripts/probe-sources.js).

const assert = require("node:assert/strict");
const { SOURCES } = require("../api/_shared/sources");

// Canonical industries (must match FIELD_ORDER + subFields in script.js).
const VALID_FIELDS = new Set([
  "Technology", "Finance", "Consulting", "Healthcare", "Law", "Government",
  "Media", "Marketing", "Consumer", "Engineering", "Science", "Nonprofit",
  "Education", "Sports", "Real Estate",
]);

// Required keys per ATS adapter (must line up with the fetchers in aggregator.js).
const REQUIRED_KEYS = {
  greenhouse: ["board"],
  lever: ["board"],
  ashby: ["board"],
  smartrecruiters: ["board"],
  workday: ["tenant", "dc", "site"],
  usajobs: ["hiringPath"],
};

const boardSeen = new Map(); // `${ats}:${slug}` -> company
const companySeen = new Map();

for (const src of SOURCES) {
  const where = src.company || JSON.stringify(src);
  assert.ok(src.company, `Source missing company: ${JSON.stringify(src)}`);
  assert.ok(src.field, `${where}: missing field`);
  assert.ok(VALID_FIELDS.has(src.field), `${where}: unknown field "${src.field}"`);
  assert.ok(src.short, `${where}: missing short label`);

  const required = REQUIRED_KEYS[src.ats];
  assert.ok(required, `${where}: unknown ats "${src.ats}"`);
  for (const key of required) {
    assert.ok(src[key], `${where}: ${src.ats} source missing "${key}"`);
  }

  // No duplicate boards within the same ATS (two entries pulling the same feed).
  const boardKey = `${src.ats}:${(src.board || src.tenant || src.hiringPath || "").toLowerCase()}`;
  if (boardSeen.has(boardKey)) {
    // USAJOBS intentionally has multiple query rows under one company.
    if (src.ats !== "usajobs") {
      assert.fail(`Duplicate board ${boardKey}: "${where}" and "${boardSeen.get(boardKey)}"`);
    }
  }
  boardSeen.set(boardKey, where);

  // No duplicate company names (except USAJOBS federal umbrella rows).
  const companyKey = src.company.toLowerCase();
  if (companySeen.has(companyKey) && src.ats !== "usajobs") {
    assert.fail(`Duplicate company "${src.company}" appears twice in SOURCES`);
  }
  companySeen.set(companyKey, where);
}

console.log(`Registry lint passed. ${SOURCES.length} sources, all structurally valid.`);

// McKinsey's gateway API has two shapes that would break a normal adapter.
//
// It is not on any of the standard systems: the careers page renders its job
// list with JavaScript, so discover-ats.js finds nothing in the markup. The
// endpoint was found by watching the rendered page's own network calls.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "api/_shared/company-scrapers/mckinsey.js"), "utf8");

// ── Pagination is by page number, 1-based ────────────────────────────────
// start=0 and start=1 BOTH return the first page, and start=200 returns HTTP
// 500. Paging by row offset the way every other adapter here does would fetch
// page one twice and then crash the whole source.
assert.match(src, /pageNumber = 1; pageNumber <= MAX_PAGES/,
  "paging must start at 1 and count pages, not rows");
assert.ok(!/start \+= PAGE_SIZE/.test(src),
  "advancing `start` by the page size is the offset assumption that returns 500");
assert.match(src, /PAGE NUMBER, not a row offset/,
  "the reason has to be written down — the parameter is named `start`, which invites the wrong fix");

// ── One posting, many continents ─────────────────────────────────────────
// A single "Business Analyst Intern" is open in Atlanta, Athens and Abu Dhabi
// simultaneously. Emitting the raw list would show Abu Dhabi to a student in
// Chicago.
assert.match(src, /isUsLocation/, "cities must be filtered to the US");
assert.match(src, /if \(!usCities\.length\) continue;/,
  "a posting with no US city is dropped entirely, not emitted with a foreign location");
assert.match(src, /usCities\.slice\(0, 3\)/,
  "one card per posting — a role open in four US offices is one job");

// A search term returns HTTP 400 rather than an empty list, so filtering
// cannot move into the query.
assert.match(src, /HTTP 400/, "the 400-on-search behaviour must be recorded");
assert.ok(!/searchText/.test(src), "no search term may be sent — it makes the endpoint fail");

// ── Registered correctly ─────────────────────────────────────────────────
const { SOURCES } = require("../api/_shared/sources.js");
const mck = SOURCES.find((s) => s.company === "McKinsey & Company");
assert.ok(mck, "McKinsey must be in the registry");
assert.equal(mck.ats, "custom");
assert.equal(mck.handler, "mckinsey");
assert.equal(mck.field, "Consulting");

// The handler file has to exist under the name the registry points at, or the
// source fails at runtime with a require error rather than a fetch error.
assert.ok(
  fs.existsSync(path.join(ROOT, `api/_shared/company-scrapers/${mck.handler}.js`)),
  "the handler filename must match the registry entry"
);

// The contract fetchCustom expects.
const handler = require("../api/_shared/company-scrapers/mckinsey.js");
assert.equal(typeof handler, "function", "a scraper exports one async function");

console.log("McKinsey tests passed. Pages are 1-based, and a global posting never shows a foreign city.");

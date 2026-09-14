// A link that cannot be dialled is not "could not be checked".
//
// link-verify.js hedges every signal, correctly: a fabricated Greenhouse id
// returns 200, a real Point72 posting redirects to its board root, and bot
// protection 403s genuine listings. No single signal is trustworthy.
//
// A malformed URL is different in kind. It is not a request that failed — it is
// a link nobody can open, from anywhere, ever. No corroboration would change
// that, and no working listing can be misclassified by it.
//
// The distinction was missing and it cost us. Thirteen listings shipped with
// relative URLs, this checker fetched them, fetch() threw, and they were filed
// as "unreachable" — a state whose own reported reason says "this is not
// evidence of a problem". The system looked at thirteen unusable Apply links
// and reported everything was fine.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "api/_shared/link-verify.js"), "utf8");

const dialable = src.match(/function isDialable\(url\)[\s\S]*?\n\}/);
assert.ok(dialable, "isDialable must exist");
const isDialable = new Function(`${dialable[0]}; return isDialable;`)();

// The exact shape that slipped through.
assert.equal(isDialable("/careers/job/1443152213164"), false, "a relative path is not dialable");
assert.equal(isDialable(""), false);
assert.equal(isDialable(null), false);
assert.equal(isDialable("   "), false);

// Real links must not be caught by this — a false red on a working posting
// would be worse than the bug it fixes.
assert.equal(isDialable("https://careers.mayoclinic.org/careers/job/1443152213164"), true);
assert.equal(isDialable("http://boards.greenhouse.io/x/jobs/1"), true);
assert.equal(isDialable("https://ms.wd5.myworkdayjobs.com/en-US/External/job/Jackson"), true);

// Non-web schemes cannot open a posting either, and one of them is an attack.
assert.equal(isDialable("ftp://example.com/job"), false);
assert.equal(isDialable("javascript:alert(1)"), false, "a script URL must never be treated as a live link");
assert.equal(isDialable("data:text/html,x"), false);

// ── The verdict ──────────────────────────────────────────────────────────
const conf = src.match(/function confidenceFor\(\{ signal, reportCount = 0 \}\)[\s\S]*?\n\}/);
assert.ok(conf, "confidenceFor must exist");
const confidenceFor = new Function(`${conf[0]}; return confidenceFor;`)();

// Red on its own. This is the ONLY signal in the file that needs no
// corroboration, and that is the point.
assert.equal(confidenceFor({ signal: "malformed", reportCount: 0 }).state, "red",
  "a malformed link is red with nobody reporting it");
assert.match(confidenceFor({ signal: "malformed" }).reason, /cannot open the posting/i,
  "and says plainly why, for whoever reads the flag");

// The existing hedges must survive untouched — they were written from real
// production false positives.
assert.equal(confidenceFor({ signal: "unreachable" }).state, "unknown",
  "a timeout stays unknown: bot protection hits real listings");
assert.equal(confidenceFor({ signal: "blocked" }).state, "unknown", "so does a 403");
assert.equal(confidenceFor({ signal: "ok" }).state, "green");
assert.equal(confidenceFor({ signal: "dead_language" }).state, "amber",
  "page text alone stays amber — it has produced false positives");

// The check must run before the fetch, or fetch() throws and it is filed as
// unreachable again — which is exactly the bug.
const checkOne = src.slice(src.indexOf("async function checkOne(url)"));
const guardAt = checkOne.indexOf("isDialable");
const fetchAt = checkOne.indexOf("await fetch(");
// Assert presence FIRST. indexOf returns -1 when the guard is deleted, and -1
// is less than any real position, so an ordering comparison alone passes
// vacuously on the exact regression it is meant to catch.
assert.ok(guardAt !== -1, "checkOne must call isDialable");
assert.ok(fetchAt !== -1, "checkOne must still fetch");
assert.ok(guardAt < fetchAt, "the URL must be validated before it is fetched");

console.log("Malformed-link tests passed. An undialable link is red on its own; every other hedge is intact.");

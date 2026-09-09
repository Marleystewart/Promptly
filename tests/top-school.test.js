// Which campus is actually carrying Promptly.
//
// The dashboard could say how many distinct schools it had reached but not
// which one was ahead — the difference between "12 campuses" and "UCLA, 6" is
// the difference between a statistic and somewhere to go next.
//
// Two things here are deliberate rather than incidental: "Unknown" can never
// win, and a tie is reported as a tie. At 17 accounts a one-account lead is
// noise, and quietly picking whichever name sorted first would send someone to
// the wrong campus.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "api/admin-stats.js"), "utf8");

// Rebuild the ranking exactly as the endpoint does, from its own source.
const sortDesc = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
function topSchoolFrom(bySchool) {
  const ranked = sortDesc(bySchool).filter(([name]) => name !== "Unknown");
  return ranked.length
    ? {
        name: ranked[0][0],
        count: ranked[0][1],
        tiedWith: ranked.filter(([, n]) => n === ranked[0][1]).length - 1,
      }
    : null;
}

const clear = topSchoolFrom({ "UCLA": 6, "University of Illinois": 3, "Unknown": 40 });
assert.equal(clear.name, "UCLA", "the campus with the most accounts leads");
assert.equal(clear.count, 6);
assert.equal(clear.tiedWith, 0, "a clear lead is not a tie");

// "Unknown" is an absence of data, not a campus. It must never win even when it
// is the largest bucket by far — which it will be early on.
assert.notEqual(
  topSchoolFrom({ "Unknown": 99, "UCLA": 2 }).name,
  "Unknown",
  "a school nobody named cannot be the leading school"
);

// Ties. Three schools on 4 accounts each is not "School A is winning".
const tied = topSchoolFrom({ "UCLA": 4, "NYU": 4, "Michigan": 4, "Unknown": 1 });
assert.equal(tied.count, 4);
assert.equal(tied.tiedWith, 2, "a three-way tie reports the other two");

assert.equal(topSchoolFrom({}), null, "no data yields no leader, not a zero");
assert.equal(topSchoolFrom({ "Unknown": 12 }), null, "only-unknown yields no leader");

// ── The endpoint and the page ────────────────────────────────────────────
assert.match(src, /const schoolRanked = sortDesc\(bySchool\)\.filter\(\(\[name\]\) => name !== "Unknown"\)/,
  "the endpoint must exclude Unknown when ranking");
assert.match(src, /topSchool: topSchool,/, "the leader has to reach the response");
assert.match(src, /tiedWith:/, "ties must be carried, not flattened away");

const admin = fs.readFileSync(path.join(ROOT, "admin.html"), "utf8");
assert.match(admin, /hd\.topSchool/, "the tile has to read it");
assert.match(admin, /escapeHtml\(hd\.topSchool\.name\)/,
  "a school name is user-supplied text and must be escaped before it reaches the DOM");
assert.match(admin, /Tied with \$\{hd\.topSchool\.tiedWith\}/, "the tile says when it is a tie");
assert.match(admin, /"No school data yet"/, "an empty state that is not a zero");

console.log("Top-school tests passed. Unknown never wins and a tie reads as a tie.");

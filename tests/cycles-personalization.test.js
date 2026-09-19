// The phone calendar leads with the student's own fields.
//
// Cam opened Cycles and found Finance at the top of a list he had no interest
// in. The groups were ordered by how busy each industry is, which on this
// dataset means Finance for everyone — on a phone, where only a few rows fit,
// that is a wall of noise before you reach anything you care about.
//
// The risk in narrowing a list is the opposite failure: a quiet month in the
// student's own field reads as "Promptly has no data". These assertions pin
// the guards that stop that.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const markup = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const styles = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");

const start = script.indexOf("function renderCyclesMobile(");
assert.ok(start >= 0, "renderCyclesMobile must exist");
const mobile = script.slice(start, script.indexOf("\n}\n", start));

// Narrowing is driven by the fields the student actually picked. userFields()
// falls back to every field when none are chosen, which would silently mean
// "narrow to everything" — the wrong signal here.
assert.match(script, /function chosenFields\(\)/,
  "a helper must distinguish 'chose these fields' from 'has not chosen'");
assert.match(mobile, /const chosen = chosenFields\(\)/,
  "the phone list must narrow by the student's own fields");
assert.match(mobile, /chosen\.length > 0 && !cycleFilters\.track/,
  "an explicitly selected track is the student's request and must not be narrowed again");

// A narrowing that empties the screen is worse than the clutter it replaced.
assert.match(mobile, /const starved =/,
  "an empty personalized month must fall back rather than show nothing");
assert.match(mobile, /starved[\s\S]{0,400}shows every field/,
  "the fallback must say why the list widened");

// The student must always be able to see everything, and must be told the list
// is narrowed — otherwise a scoped list is indistinguishable from missing data.
assert.match(markup, /data-cycm-scope/, "the phone calendar needs a scope control");
assert.match(script, /function renderCycmScope\(/, "the scope control must be rendered");
assert.match(script, /Show all/, "the control must offer a way back to every field");
assert.match(script, /button\.hidden = !canPersonalize/,
  "with no fields chosen there is nothing to narrow to, so the control must hide");

// Toggling changes group sizes, so stale expansions would show wrong counts.
assert.match(script, /data-cycm-scope[\s\S]{0,300}cycmExpanded\.clear\(\)/,
  "toggling scope must reset expanded groups");

assert.match(styles, /\.cycm-scope\b/, "the scope control must be styled");

// Desktop is deliberately untouched: it has the room, and its filter selects
// are always on screen.
const desktop = script.slice(script.indexOf("function renderCycleCalendar("),
  script.indexOf("\n}\n", script.indexOf("function renderCycleCalendar(")));
assert.doesNotMatch(desktop, /cycmMineOnly/,
  "the desktop calendar must keep showing the full filtered pool");

console.log("Cycles personalization tests passed. Phone leads with your fields, says so, and never strands you on an empty month.");

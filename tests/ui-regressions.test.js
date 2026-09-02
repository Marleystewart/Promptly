const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const assistant = fs.readFileSync(path.join(root, "assistant.js"), "utf8");

assert.match(
  script,
  /function renderCompactOpenings\(items\)[\s\S]*listingStatus\(item\) === "OPEN"/,
  "Recent Openings must render verified live postings only"
);
assert.match(
  script,
  /function needsCareersLink\(item\)[\s\S]*!isMonitored\(item\)/,
  "unmonitored placeholders need a distinct careers-link state"
);
assert.match(
  script,
  /modalAction\.setAttribute\("data-watch-company-name", item\.company\)/,
  "the placeholder modal action must lead to the careers-link flow"
);
assert.match(
  script,
  /const nameInput = document\.querySelector\("\[data-watch-company\]"\);[\s\S]*nameInput\.value = company/,
  "the careers-link flow must synchronously prefill the employer"
);
assert.match(
  script,
  /function recentOpenings\(now = Date\.now\(\)\)[\s\S]*Date\.parse\(item\.firstSeen/,
  "the Alerts view needs a defined, observed-date recent-openings selector"
);
// 590 of 788 live listings were first seen inside the 7-day window, so an
// uncapped Alerts list crashed mobile Safari out of memory.
assert.match(
  script,
  /if \(name === "alerts"\)[\s\S]*renderRows\(recent/,
  "the Alerts view must render through the row cap, not map every match"
);
assert.doesNotMatch(
  script,
  /recent\.map\(openingRow\)/,
  "the Alerts view must never render an uncapped row list"
);
assert.doesNotMatch(
  script,
  /This employer does not publish a job feed Promptly can read/,
  "placeholder cards should not present a normal coverage state as an error"
);
assert.doesNotMatch(script, /just opened\.`;/, "featured cards must not claim an unbounded listing just opened");
assert.match(script, /isMobileDevice\(\) \|\| isNarrowViewport\(\)/, "narrow layouts must receive mobile-length headings");
assert.match(css, /\.opening-row\.awaiting\s*\{\s*opacity:\s*1;/, "awaiting cards must remain readable");
assert.match(css, /env\(safe-area-inset-bottom/, "fixed mobile controls must respect the iPhone safe area");
assert.match(
  css,
  /\.opening-row\.awaiting \.row-actions \.round-btn\s*\{[\s\S]*flex:\s*0 0 44px/,
  "a single awaiting-card icon action must not stretch full width"
);
assert.match(assistant, /querySelector\("\.top-actions"\)/, "Ask Promptly must be docked away from listing content");
assert.match(css, /\.top-actions \.ap-launcher\s*\{[\s\S]*position:\s*static/, "the docked helper must not float over cards");

console.log("Mobile UI regression tests passed.");

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
// A collapsed card must not print the same date twice ("Closes: Opens Aug 15,
// 2026 · Applications open Aug 15, 2026").
assert.match(script, /function cardMetaLine\(item\)/, "collapsed cards need one deduplicated metadata line");
{
  const source = script.match(/function cardMetaLine[\s\S]*?\n}\n/)[0];
  const metaLine = new Function("item", source + "return cardMetaLine(item);");
  assert.equal(
    metaLine({ deadline: "Opens Aug 15, 2026", opened: "Applications open Aug 15, 2026" }),
    "Opens Aug 15, 2026",
    "one date worded two ways must collapse to one"
  );
  assert.equal(
    metaLine({ deadline: "See posting", opened: "Live • San Francisco" }),
    "Closes: See posting · Live • San Francisco",
    "a second part that adds information must survive"
  );
  assert.equal(metaLine({ deadline: "Rolling", opened: "" }), "Rolling", "a missing half must not leave a dangling separator");
  assert.equal(
    metaLine({ deadline: "See posting", opened: "Live • Columbus", location: "Columbus, OH" }),
    "Closes: See posting · Live",
    "a place already shown on the Location line must not repeat in the meta line"
  );
  assert.equal(
    metaLine({ deadline: "See posting", opened: "Live • Boston", location: "Seattle, WA" }),
    "Closes: See posting · Live • Boston",
    "a genuinely different place must survive — this is dedup, not truncation"
  );
}

// The mobile layer must reach mobile browsers, not only the installed app.
assert.match(
  css,
  /@media \(max-width: 720px\), \(display-mode: standalone\)/,
  "compact density must apply at phone widths, not only in standalone"
);
// Tertiary buttons must never fall back to native browser styling.
assert.match(css, /\.tiny-action\s*\{[\s\S]*appearance: none/, ".tiny-action must be styled, not a default browser button");
// Page clearance and the nav bar must come from one number.
assert.match(css, /--nav-total:/, "bottom-nav clearance must be derived from a token");

// 590 of 788 live listings were first seen inside the 7-day window, so an
// uncapped Alerts list crashed mobile Safari out of memory.
assert.match(
  script,
  /if \(name === "alerts"\) renderAlertsList\(\);/,
  "the Alerts view must render through the capped, chip-filtered renderer"
);
assert.match(
  script,
  /function renderAlertsList\(\)[\s\S]*renderAlertGroups\(recentOpenings\(\)\)/,
  "the Alerts list must be redrawable in place without a full view change"
);
assert.doesNotMatch(
  script,
  /recent\.map\(openingRow\)/,
  "the Alerts view must never render an uncapped row list"
);
// Alerts filters by category chip rather than stacking every field at once.
assert.match(script, /data-alert-field=/, "Alerts needs category chips");
assert.match(
  script,
  /const alertFieldButton = event\.target\.closest\("\[data-alert-field\]"\);[\s\S]*renderAlertsList\(\);\s*return;/,
  "alert chips must be handled before the openings .filter-chip branch claims the click"
);
{
  const groupSrc = script.match(/function alertFieldGroups\(list\)[\s\S]*?\n}\n/)[0];
  const renderSrc = script.match(/function renderAlertGroups\(list\)[\s\S]*?\n}\n/)[0];
  const render = new Function(
    "profile", "MAX_ROWS", "esc", "openingRow", "renderRows", "list",
    "let alertsField = null;" + groupSrc + renderSrc + "return renderAlertGroups(list);"
  );
  const make = (field, n) => Array.from({ length: n }, (_, i) => ({ field, role: `${field} ${i}` }));
  const listings = [...make("Finance", 40), ...make("Technology", 30), ...make("Law", 3)];
  const html = render(
    { fields: ["Law"] },
    60,
    (s) => String(s),
    (item) => `<article>${item.role}</article>`,
    (rows) => rows.slice(0, 60).map((r) => `<article>${r.role}</article>`).join(""),
    listings
  );
  const chips = (html.match(/data-alert-field="/g) || []).length;
  assert.equal(chips, 3, "one chip per category present in the feed");
  assert.ok(
    html.indexOf('data-alert-field="Law"') < html.indexOf('data-alert-field="Finance"'),
    "a field the student follows must lead, ahead of larger categories"
  );
  assert.match(html, /data-alert-field="Law"[^>]*aria-pressed="true"/, "the leading category is selected by default");
  const cards = (html.match(/<article>/g) || []).length;
  assert.equal(cards, 3, "only the selected category's listings render, not every category at once");
}
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

// No permanently disabled controls. A checkbox that can never be ticked reads
// as an abandoned product, and "Coming next with SMS setup" had been sitting in
// Settings unbuilt. Ship the feature or remove the control.
const markup = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert.doesNotMatch(markup, /Coming next with SMS setup/, "the dead SMS checkbox must stay removed");
{
  const disabled = markup.match(/<input[^>]*\bdisabled\b[^>]*>/g) || [];
  assert.equal(
    disabled.length, 0,
    `Settings must not offer a control nobody can use. Found: ${disabled.join(" ")}`
  );
}

// Onboarding must not let someone finish with zero fields.
//
// Alerts are matched on fields, so an account with none matches nothing and can
// never receive a single alert — silently, forever. Inference covers "Computer
// Science" but returns nothing for "Undeclared", "General Studies" or "Liberal
// Arts", which is exactly the underclassmen Promptly is built for. The signup
// funnel found one confirmed account in precisely this state.
assert.match(script, /function validateInterests\(\)/, "onboarding needs a fields check");
assert.match(
  script,
  /syncInferredFields\(\);\s*\n\s*if \(!validateInterests\(\)\) return;/,
  "fields must be inferred first, then validated — otherwise we ask for something they just supplied"
);
assert.match(markup, /data-interests-error/, "the fields step needs somewhere to show the error");
{
  const enterApp = script.match(/function enterApp\(\)[\s\S]*?\n}/)[0];
  assert.ok(
    enterApp.indexOf("validateInterests") < enterApp.indexOf("saveSubscriber"),
    "the check must run before the account is saved, not after"
  );
}

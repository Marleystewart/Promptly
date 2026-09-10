// Every Eightfold posting was dated January 1970.
//
// The adapter carried a comment saying "postedTs and creationTs are epoch
// milliseconds" and the conversion trusted it. They are epoch SECONDS.
// Verified against live Qualcomm data on 9 Sep 2026: postedTs 1788912000 is
// 2026-09-09, and reading it as milliseconds gives 1970-01-21.
//
// Not cosmetic. postedAt drives the recruiting-cycle calendar and the "posted"
// line on a card, so every Qualcomm, Ford and Mayo Clinic role sorted and
// displayed as 56 years old.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "api/_shared/eightfold.js"), "utf8");

const match = src.match(/const MS_THRESHOLD[\s\S]*?\nfunction epochToIso\(value\) \{[\s\S]*?\n\}/);
assert.ok(match, "epochToIso must exist");
const epochToIso = new Function(`${match[0]}; return epochToIso;`)();

// The exact value that exposed it.
assert.equal(epochToIso(1788912000), "2026-09-09T00:00:00.000Z",
  "epoch seconds must be read as seconds");
assert.ok(!epochToIso(1788912000).startsWith("1970"), "the 1970 bug must not come back");

// Milliseconds still work, so a future switch by Eightfold does not silently
// push every date to the year 58000.
assert.equal(epochToIso(1788912000000), "2026-09-09T00:00:00.000Z",
  "a millisecond value must be read as milliseconds");

// Junk produces no date rather than a wrong one — a card with a nonsense
// posting date is worse than a card with none.
for (const bad of [null, undefined, 0, -1, "", "not-a-number", NaN]) {
  assert.equal(epochToIso(bad), null, `${JSON.stringify(bad)} must yield null`);
}

// The stale comment is what caused this, so it must not survive.
assert.ok(
  !/postedTs and creationTs are epoch milliseconds/.test(src),
  "the comment that asserted milliseconds must be gone — it is what the bug was built on"
);
assert.match(src, /epoch SECONDS/, "and the correct unit has to be stated");

// The conversion must go through the helper, not inline.
assert.ok(
  !/new Date\(Number\(job\.postedTs\)\)/.test(src),
  "the raw millisecond conversion must not remain anywhere"
);

console.log("Eightfold date tests passed. Seconds read as seconds, and 1970 is gone.");

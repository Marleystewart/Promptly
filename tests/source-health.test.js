// Source-health state machine. No network, no Redis.
//
// The point of this dashboard is catching a scraper that broke silently. A
// false green defeats it entirely, so the transitions are asserted directly.

const assert = require("node:assert/strict");
const { stateFor, mergeEntry } = require("../api/_shared/source-health.js");

const T1 = "2026-08-01T00:00:00.000Z";
const T2 = "2026-08-02T00:00:00.000Z";
const T3 = "2026-08-03T00:00:00.000Z";

// ── A healthy source ──────────────────────────────────────────────────────
const healthy = mergeEntry(null, { company: "Citi", ats: "custom", ok: true, count: 12 }, T1);
assert.strictEqual(stateFor(healthy), "ok");
assert.strictEqual(healthy.bestCount, 12);
assert.strictEqual(healthy.brokeAt, null);

// ── The case this whole feature exists for ────────────────────────────────
// A scraper that ran clean but silently stopped returning anything. No error
// is thrown — the employer just changed their page — so "ok: true" alone must
// never be enough to call it stable.
const wentSilent = mergeEntry(healthy, { company: "Citi", ats: "custom", ok: true, count: 0 }, T2);
assert.strictEqual(stateFor(wentSilent), "broken",
  "a source that used to produce and now produces nothing is broken, not quiet");
assert.strictEqual(wentSilent.brokeAt, T2, "brokeAt is stamped when it goes bad");
assert.strictEqual(wentSilent.bestCount, 12, "the baseline must survive so the drop stays visible");

// brokeAt must not creep forward on every later check, or the dashboard would
// always read "broken just now" and hide how long it has been down.
const stillBroken = mergeEntry(wentSilent, { company: "Citi", ats: "custom", ok: true, count: 0 }, T3);
assert.strictEqual(stillBroken.brokeAt, T2, "brokeAt stays at the original failure");

// ── Recovery ──────────────────────────────────────────────────────────────
const recovered = mergeEntry(stillBroken, { company: "Citi", ats: "custom", ok: true, count: 9 }, T3);
assert.strictEqual(stateFor(recovered), "ok");
assert.strictEqual(recovered.brokeAt, null, "recovery clears brokeAt");
assert.strictEqual(recovered.bestCount, 12, "bestCount is a high-water mark, it never drops");

// ── Quiet is not broken ───────────────────────────────────────────────────
// Most campus boards are genuinely empty outside Sept-Nov. A source that has
// never produced anything must not cry wolf, or every off-season board would
// show red and the signal would be worthless.
const neverProduced = mergeEntry(null, { company: "Natera", ats: "greenhouse", ok: true, count: 0 }, T1);
assert.strictEqual(stateFor(neverProduced), "quiet");
assert.strictEqual(neverProduced.brokeAt, null);
const stillQuiet = mergeEntry(neverProduced, { company: "Natera", ats: "greenhouse", ok: true, count: 0 }, T2);
assert.strictEqual(stateFor(stillQuiet), "quiet", "a board that was always empty stays quiet, not broken");

// ── Hard failures ─────────────────────────────────────────────────────────
const errored = mergeEntry(healthy, { company: "Citi", ats: "custom", ok: false, error: "500 citi" }, T2);
assert.strictEqual(stateFor(errored), "broken");
assert.strictEqual(errored.error, "500 citi");
assert.strictEqual(errored.count, 0, "a failed run contributes no count");
// An error on a never-working source is still broken — it is a real fault.
const erroredFresh = mergeEntry(null, { company: "New Co", ats: "custom", ok: false, error: "timeout" }, T1);
assert.strictEqual(stateFor(erroredFresh), "broken");

// ── Field, for the health page's industry filter ──────────────────────────
const withField = mergeEntry(null, { company: "Citi", ats: "custom", field: "Finance", ok: true, count: 4 }, T1);
assert.strictEqual(withField.field, "Finance");
// A source's field cannot change between runs, so a later run missing it
// (defensive coding elsewhere, not expected in practice) must not erase it.
const fieldPreserved = mergeEntry(withField, { company: "Citi", ats: "custom", ok: true, count: 5 }, T2);
assert.strictEqual(fieldPreserved.field, "Finance", "field must survive a run that omitted it");
const neverHadField = mergeEntry(null, { company: "Old Co", ats: "custom", ok: true, count: 1 }, T1);
assert.strictEqual(neverHadField.field, "Unknown", "missing field falls back to a labelled bucket, not undefined");

console.log("Source health tests passed.");

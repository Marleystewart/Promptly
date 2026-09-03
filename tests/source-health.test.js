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

// ── A source that ran clean but stopped returning anything ────────────────
// This is DORMANT, not broken. It is usually an employer's posting being
// filled, not a scraper failing — on 3 Sep all 14 sources the dashboard called
// "needs attention" fetched perfectly when probed, and nine had gone from a
// single role to zero. It still must not read as "stable", because a genuine
// silent break looks identical from here; it just must not raise an alarm.
const wentSilent = mergeEntry(healthy, { company: "Citi", ats: "custom", ok: true, count: 0 }, T2);
assert.strictEqual(stateFor(wentSilent), "dormant",
  "produced before, zero now, fetched fine = dormant (churn), not broken");
assert.notStrictEqual(stateFor(wentSilent), "ok", "but it is still not stable");

// Only an actual fetch failure is broken — the one state worth an alert.
const fetchFailed = mergeEntry(healthy, { company: "Citi", ats: "custom", ok: false, error: "404" }, T2);
assert.strictEqual(stateFor(fetchFailed), "broken", "an errored fetch is the real fault");
assert.strictEqual(wentSilent.brokeAt, T2, "brokeAt is stamped when it stops contributing");
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

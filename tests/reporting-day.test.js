// "Today" on the dashboard means an Eastern day, not a UTC one.
//
// The bug this fixes was visible rather than subtle: at 9:27pm Eastern on
// launch day the founder dashboard read "Signups today: 0" directly beside
// "Accounts: 17". Both numbers were correct. The UTC day had rolled over at
// 8pm Eastern, so "today" was 90 minutes old and genuinely empty, while every
// signup sat in a day the dashboard now called yesterday.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { dayKey, dayKeyAgo, REPORTING_TIME_ZONE } = require("../api/_shared/day");

const ROOT = path.join(__dirname, "..");

assert.equal(REPORTING_TIME_ZONE, "America/New_York");

// The exact failure. 01:27 UTC on the 9th is 21:27 Eastern on the 8th.
assert.equal(dayKey(new Date("2026-09-09T01:27:00Z")), "2026-09-08",
  "an evening in Eastern belongs to that evening's day, not to tomorrow");

// The boundary itself: Eastern midnight is 04:00 UTC in September (EDT).
assert.equal(dayKey(new Date("2026-09-09T03:59:00Z")), "2026-09-08", "one minute before Eastern midnight");
assert.equal(dayKey(new Date("2026-09-09T04:00:00Z")), "2026-09-09", "Eastern midnight starts the new day");

// Daylight saving, which is why this uses Intl rather than a fixed offset.
// Eastern is UTC-4 in summer and UTC-5 in winter, so the boundary moves.
assert.equal(dayKey(new Date("2026-01-15T04:30:00Z")), "2026-01-14", "winter: 04:30 UTC is still the 14th (EST)");
assert.equal(dayKey(new Date("2026-07-15T03:30:00Z")), "2026-07-14", "summer: 03:30 UTC is still the 14th (EDT)");
assert.equal(dayKey(new Date("2026-01-15T05:30:00Z")), "2026-01-15", "winter: 05:30 UTC has crossed into the 15th");

// Shape is unchanged, so existing keys and string comparisons still work.
assert.match(dayKey(new Date("2026-09-09T01:27:00Z")), /^\d{4}-\d{2}-\d{2}$/);

// Stepping back N days works across a DST transition without dropping or
// repeating a day. US Eastern springs forward on 2026-03-08.
const around = new Date("2026-03-10T18:00:00Z");
const keys = [0, 1, 2, 3, 4].map((n) => dayKeyAgo(n, around));
assert.deepEqual(keys, ["2026-03-10", "2026-03-09", "2026-03-08", "2026-03-07", "2026-03-06"],
  "seven-day windows must not skip or repeat the DST day");

assert.equal(dayKey("not a date"), null, "junk gets no day rather than a crash");
assert.equal(dayKeyAgo(3, "not a date"), null);

// ── Everything that reports a day must agree ─────────────────────────────
// lastActiveOn is WRITTEN by store.js and READ by admin-stats.js. If those two
// ever use different zones, "active today" silently undercounts for four hours
// every evening.
const reporting = {
  "api/_shared/analytics.js": "the daily event counters",
  "api/_shared/store.js": "lastActiveOn, which the dashboard compares against",
  "api/admin-stats.js": "the active-today and last-7-days windows",
  "api/_shared/funnel.js": "retention, which also compares against lastActiveOn",
};
for (const [file, why] of Object.entries(reporting)) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  assert.match(src, /require\(".*day"\)/, `${file} must use the shared reporting day (${why})`);
  assert.ok(
    !/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/.test(src),
    `${file} still computes a UTC day inline (${why})`
  );
}

// The one deliberate exception, kept UTC on purpose and documented as such.
const retention = fs.readFileSync(path.join(ROOT, "api/retention.js"), "utf8");
assert.match(retention, /idempotency key, not a report/,
  "the digest claim key stays UTC and must say why, so nobody 'fixes' it later");

console.log("Reporting-day tests passed. Today is Eastern, DST included, and the delivery key stays UTC.");

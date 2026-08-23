// Student reports steer the link checker — but never decide on their own.
//
// A prior investigation proved no single link signal is trustworthy: a
// fabricated Greenhouse id returns 200, a genuine Point72 link redirects to
// its board root, and Akuna/Epic return 403 while working perfectly. Page text
// lies too — a real Blue Origin posting tripped the dead-language regex on
// "...accepted on an ongoing basis UNTIL the requisition is closed".
//
// So reports change WHICH listings get checked and how a human sees them.
// They must never, alone, mark a listing dead — and nothing here removes
// anything from the live feed.

const assert = require("node:assert/strict");
const { pickSlice, confidenceFor, reportedUrlCounts } = require("../api/_shared/link-verify");

const opening = (n, extra = {}) => ({
  company: `Company ${n}`,
  role: "Intern",
  sourceUrl: `https://example.com/job/${n}`,
  ...extra,
});

// --- Reports jump the queue ------------------------------------------------
{
  // 300 live listings; the daily budget is 60. Listing 250 sits far outside
  // today's rotating window and would otherwise wait days for its turn.
  const openings = Array.from({ length: 300 }, (_, i) => opening(i));
  const reports = [
    { url: "https://example.com/job/250", count: 3, resolved: false },
    { url: "https://example.com/job/299", count: 1, resolved: false },
  ];

  const counts = reportedUrlCounts(reports);
  const slice = pickSlice(openings, counts, 0);
  const urls = slice.map((o) => o.sourceUrl);

  assert.ok(urls.includes("https://example.com/job/250"), "a reported listing must be checked the same run");
  assert.ok(urls.includes("https://example.com/job/299"), "every reported listing must be checked");
  assert.equal(urls[0], "https://example.com/job/250", "most-reported goes first");
  assert.equal(slice.length, 60, "the daily budget must still be respected");
  assert.equal(new Set(urls).size, urls.length, "no listing may be checked twice in one run");
}

// --- Resolved reports stop mattering ---------------------------------------
{
  const counts = reportedUrlCounts([
    { url: "https://example.com/job/1", count: 9, resolved: true },
    { url: "https://example.com/job/2", count: 1, resolved: false },
  ]);
  assert.equal(counts.get("https://example.com/job/1"), undefined,
    "a report a human already resolved must not keep steering the checker");
  assert.equal(counts.get("https://example.com/job/2"), 1);
}

// --- A report for a listing no longer live is simply absent ----------------
{
  const openings = [opening(1), opening(2)];
  const counts = reportedUrlCounts([{ url: "https://example.com/job/999", count: 5, resolved: false }]);
  const slice = pickSlice(openings, counts, 0);
  assert.equal(slice.length, 2, "reports for dropped listings must not break the slice");
}

// --- Full coverage still happens -------------------------------------------
{
  // With no reports at all, behaviour is the original rotating window.
  const openings = Array.from({ length: 100 }, (_, i) => opening(i));
  const day1 = pickSlice(openings, new Map(), 0).map((o) => o.sourceUrl);
  const day2 = pickSlice(openings, new Map(), 86400000).map((o) => o.sourceUrl);
  assert.equal(day1.length, 60);
  assert.notDeepEqual(day1, day2, "the window must still rotate so everything gets a turn");
}

// --- Confidence: red needs TWO independent signals -------------------------
assert.equal(
  confidenceFor({ signal: "dead_language", reportCount: 2 }).state, "red",
  "report + dead-language text agreeing is the only path to red"
);

assert.equal(
  confidenceFor({ signal: "dead_language", reportCount: 0 }).state, "amber",
  "page text alone must never be red — it has produced false positives on real listings"
);

assert.equal(
  confidenceFor({ signal: "ok", reportCount: 5 }).state, "amber",
  "student reports alone must never be red — the page may be fine and the report about wrong details"
);

assert.equal(
  confidenceFor({ signal: "ok", reportCount: 0 }).state, "green"
);

// --- Unreachable is never evidence of a problem ----------------------------
for (const signal of ["blocked", "server_error", "unreachable"]) {
  assert.equal(
    confidenceFor({ signal, reportCount: 0 }).state, "unknown",
    `${signal} must be "unknown", never red — bot protection hits real, working listings`
  );
  assert.notEqual(
    confidenceFor({ signal, reportCount: 3 }).state, "red",
    `${signal} plus a report must still not reach red — there is no second confirming signal`
  );
}

// Every state explains itself, since a human acts on this.
for (const args of [
  { signal: "dead_language", reportCount: 1 },
  { signal: "ok", reportCount: 1 },
  { signal: "blocked", reportCount: 0 },
]) {
  assert.ok(confidenceFor(args).reason.length > 20, "each verdict must carry a human-readable reason");
}

console.log("Link confidence tests passed. Reports prioritise; two signals are required for red.");

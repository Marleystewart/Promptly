// Why the daily check cried wolf.
//
// On 9 September it reported "6 sources failed to fetch (SpaceX, Gopuff, Oscar
// Health, Okta, Virtu Financial, …)". Every one of those boards answered a
// direct request in under 400ms. They were not down.
//
// The aggregator fired all ~350 sources through Promise.allSettled at the same
// instant, each with a 12-second timeout, and timed itself out. The failures
// were self-inflicted, and they moved from run to run — which is the worst
// possible property for a daily alert, because it trains you to ignore it.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { settleWithConcurrency, isWorthRetrying, FETCH_CONCURRENCY } = require("../api/_shared/aggregator");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "api/_shared/aggregator.js"), "utf8");

// ── The congestion itself ────────────────────────────────────────────────
assert.ok(
  !/Promise\.allSettled\(\s*allSources\.map/.test(src),
  "every source must not be fetched at once — that is the bug"
);
assert.match(src, /settleWithConcurrency\(allSources, FETCH_CONCURRENCY, fetchOne\)/,
  "the aggregate run goes through the bounded pool");
assert.ok(FETCH_CONCURRENCY > 1 && FETCH_CONCURRENCY <= 24,
  "bounded, but not serial: 350 sources one at a time would not finish in the function's time limit");

(async () => {
  // The pool must actually bound concurrency, preserve order, and isolate
  // failures — all three, or the feed silently changes shape.
  let running = 0, peak = 0;
  const items = Array.from({ length: 50 }, (_, i) => i);
  const out = await settleWithConcurrency(items, 8, async (n) => {
    running += 1; peak = Math.max(peak, running);
    await new Promise((r) => setTimeout(r, 4));
    running -= 1;
    if (n % 9 === 0) throw new Error(`boom ${n}`);
    return n * 3;
  });

  assert.equal(out.length, 50, "every source is accounted for");
  assert.ok(peak <= 8, `concurrency must stay within the limit (peaked at ${peak})`);
  assert.ok(peak > 1, "and must not collapse to serial");
  assert.equal(out[4].value, 12, "results stay in input order");
  assert.equal(out[49].value, 147, "including the last one");
  assert.equal(out[9].status, "rejected", "a failing source is rejected, not thrown");
  assert.equal(out[10].status, "fulfilled", "and does not take its neighbours with it");

  // Order matters more than it looks: sourceStatus is matched back to
  // allSources by index, so a reordered result set would attribute one
  // employer's failure to another.
  const shifted = await settleWithConcurrency([5, 1, 9], 3, async (n) => {
    await new Promise((r) => setTimeout(r, n));
    return n;
  });
  assert.deepEqual(shifted.map((r) => r.value), [5, 1, 9],
    "slow items must not be reordered ahead of fast ones");

  // ── What deserves a second attempt ─────────────────────────────────────
  assert.equal(isWorthRetrying({ name: "TimeoutError" }), true, "a timeout is worth retrying");
  assert.equal(isWorthRetrying({ name: "AbortError" }), true, "so is an abort");
  assert.equal(isWorthRetrying(new TypeError("fetch failed")), true, "so is a dropped connection");
  // A status code is the board answering. A 404 means the slug is wrong, and
  // retrying doubles our traffic against a board telling us the truth.
  assert.equal(isWorthRetrying(new Error("404 https://boards-api.greenhouse.io/v1/boards/nope/jobs")), false,
    "an HTTP status is a real answer and must not be retried");
  assert.equal(isWorthRetrying(null), false, "no error is not a retry");

  // One retry, not a loop: a genuinely slow board would otherwise be hit
  // repeatedly inside a run that has a hard time limit.
  const fetchOneBody = src.slice(src.indexOf("async function fetchOne(src)"));
  const body = fetchOneBody.slice(0, fetchOneBody.indexOf("\n}"));
  assert.equal((body.match(/fetcher\(src\)/g) || []).length, 2,
    "exactly one retry — the first attempt and one more");

  // fetchOne must actually CONSULT the classifier. Testing isWorthRetrying in
  // isolation proves the rule is right, not that the retry path obeys it —
  // deleting the guard leaves every assertion above passing while 404s get
  // retried against boards that already answered.
  assert.match(body, /if \(!isWorthRetrying\(error\)\) throw error;/,
    "a non-transient error must rethrow instead of retrying");

  console.log("Source fetch tests passed. Bounded concurrency, order kept, and only transient failures retry.");
})().catch((error) => { console.error(error); process.exitCode = 1; });

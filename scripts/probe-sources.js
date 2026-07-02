// Live source-health probe. Runs the real aggregator against every feed and
// reports which sources are failing, empty, or active. Used two ways:
//   • locally:  `npm run probe`
//   • nightly:  .github/workflows/source-health.yml (opens an issue on failures)
//
// Exit code is non-zero when any source ERRORS (network/HTTP failure) so CI can
// flag it. A source returning 0 matches is normal (no student roles right now),
// not a failure.

const { aggregateOpenings } = require("../api/_shared/aggregator");

(async () => {
  const result = await aggregateOpenings();
  let failed = result.sourceStatus.filter((s) => !s.ok);

  // A single 12s timeout is usually a transient network blip, not a dead feed.
  // Re-probe once and keep only the sources that fail BOTH passes, so the
  // nightly alert never fires on a flake.
  if (failed.length) {
    const retry = await aggregateOpenings();
    const stillFailing = new Set(retry.sourceStatus.filter((s) => !s.ok).map((s) => s.company));
    failed = failed.filter((s) => stillFailing.has(s.company));
  }

  const empty = result.sourceStatus.filter((s) => s.ok && s.count === 0);
  const active = result.sourceStatus.filter((s) => s.ok && s.count > 0);

  console.log(`Sources: ${result.sourceStatus.length}`);
  console.log(`Live openings: ${result.openings.length}`);
  console.log(`Active: ${active.length} | Empty: ${empty.length} | FAILED: ${failed.length}\n`);

  if (active.length) {
    console.log("=== ACTIVE ===");
    active.sort((a, b) => b.count - a.count).forEach((s) => console.log(`  ${s.company}: ${s.count}`));
  }
  if (failed.length) {
    console.log("\n=== FAILED (broken feeds — need attention) ===");
    failed.forEach((s) => console.log(`  ${s.company} [${s.ats}]: ${s.error}`));
  }

  // Non-zero exit only when a feed actually errored, so nightly CI can alert.
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error("Probe crashed:", err);
  process.exit(1);
});

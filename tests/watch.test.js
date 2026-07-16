// "Watch any company" unit tests — no network. Verifies that a pasted careers
// URL is parsed into the right ATS source config (so the real fetcher can pull
// it) and that unreadable pages are rejected rather than falsely "watched".

const assert = require("node:assert/strict");
const { detectSource, buildSource, prettifyToken } = require("../api/_shared/watch");

// ── Known ATS boards resolve to the config the aggregator understands ──────
assert.deepEqual(detectSource("https://boards.greenhouse.io/databricks"), { ats: "greenhouse", board: "databricks" });
assert.deepEqual(detectSource("https://job-boards.greenhouse.io/stripe"), { ats: "greenhouse", board: "stripe" });
assert.deepEqual(detectSource("https://boards.greenhouse.io/embed/job_board?for=airbnb"), { ats: "greenhouse", board: "airbnb" });
assert.deepEqual(detectSource("https://jobs.lever.co/netflix"), { ats: "lever", board: "netflix" });
assert.deepEqual(detectSource("https://jobs.ashbyhq.com/openai"), { ats: "ashby", board: "openai" });
assert.deepEqual(detectSource("https://jobs.smartrecruiters.com/Square"), { ats: "smartrecruiters", board: "Square" });
assert.deepEqual(
  detectSource("https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite"),
  { ats: "workday", tenant: "nvidia", dc: "wd5", site: "NVIDIAExternalCareerSite" }
);
// Workday without a locale segment still resolves the site.
assert.deepEqual(
  detectSource("https://acme.wd1.myworkdayjobs.com/Careers"),
  { ats: "workday", tenant: "acme", dc: "wd1", site: "Careers" }
);
// www. prefix is tolerated.
assert.deepEqual(detectSource("https://www.jobs.lever.co/figma"), { ats: "lever", board: "figma" });

// ── Pages we cannot auto-read return null (→ logged, never falsely watched) ─
assert.equal(detectSource("https://acme.com/careers"), null);
assert.equal(detectSource("https://linkedin.com/jobs/view/123"), null);
assert.equal(detectSource("https://greenhouse.io"), null);           // no board token
assert.equal(detectSource("https://boards.greenhouse.io/embed"), null); // embed w/o ?for=
assert.equal(detectSource("not a url"), null);
assert.equal(detectSource(""), null);
assert.equal(detectSource("ftp://boards.greenhouse.io/x"), null);    // non-http scheme

// ── buildSource fills a renderable, alert-ready record ─────────────────────
const built = buildSource({ ats: "greenhouse", board: "acme-corp" }, "");
assert.equal(built.company, "Acme Corp");     // prettified from token
assert.equal(built.short, "AC");
assert.equal(built.field, "Watched");
assert.equal(buildSource({ ats: "lever", board: "x" }, "Custom Name Inc").company, "Custom Name Inc");

// ── prettifyToken handles camelCase + separators ───────────────────────────
assert.equal(prettifyToken("openai"), "Openai");
assert.equal(prettifyToken("acme_corp"), "Acme Corp");
assert.equal(prettifyToken("bigTechCo"), "Big Tech Co");

console.log("Watch feature tests passed.");

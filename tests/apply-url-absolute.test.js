// Every Apply link must leave Promptly.
//
// The Eightfold adapter emitted `positionUrl` straight through, and Eightfold
// ALWAYS returns a relative path ("/careers/job/549798287199"). The fallback
// sitting beside it that would have built an absolute URL therefore never ran.
//
// A browser resolves a relative href against the page it is on, so Apply sent
// students to `app.joinpromptly.co/careers/job/…`, which does not exist. On
// 10 Sep 2026 thirteen live listings were in that state across Qualcomm, Mayo
// Clinic and Morgan Stanley.
//
// For a product whose entire claim is a live link to the employer's own
// posting, this is the worst thing that can be wrong — and it is invisible from
// our side, because a card with a broken link renders exactly like a good one.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const eightfold = fs.readFileSync(path.join(ROOT, "api/_shared/eightfold.js"), "utf8");
const aggregator = fs.readFileSync(path.join(ROOT, "api/_shared/aggregator.js"), "utf8");

// ── The adapter that caused it ───────────────────────────────────────────
const helper = eightfold.match(/function absoluteJobUrl[\s\S]*?\n\}/);
assert.ok(helper, "absoluteJobUrl must exist");
const absoluteJobUrl = new Function(`${helper[0]}; return absoluteJobUrl;`)();

const ORIGIN = "https://careers.mayoclinic.org";

// The exact shape Eightfold returns.
assert.equal(
  absoluteJobUrl({ positionUrl: "/careers/job/1443152213164" }, ORIGIN),
  "https://careers.mayoclinic.org/careers/job/1443152213164",
  "a relative positionUrl must be resolved against the employer's origin"
);

// An already-absolute value must survive untouched, so a tenant that starts
// returning full URLs keeps working.
assert.equal(
  absoluteJobUrl({ positionUrl: "https://example.com/job/9" }, ORIGIN),
  "https://example.com/job/9",
  "an absolute URL is left alone"
);

// The id fallback still works when there is no positionUrl at all.
assert.equal(
  absoluteJobUrl({ id: "446720737091" }, ORIGIN),
  "https://careers.mayoclinic.org/careers/job/446720737091"
);

// Nothing usable yields null rather than a link that goes nowhere.
assert.equal(absoluteJobUrl({}, ORIGIN), null, "no url and no id means no link");
assert.equal(absoluteJobUrl(null, ORIGIN), null);

// The raw pass-through must not come back.
assert.ok(
  !/url: job\.positionUrl \|\|/.test(eightfold),
  "positionUrl must never be emitted unresolved"
);

// ── The central guard ────────────────────────────────────────────────────
// One adapter caused this, but any adapter could. The check lives where every
// source's output passes through.
assert.match(
  aggregator,
  /if \(!\/\^https\?:\\\/\\\/\/i\.test\(String\(o\.sourceUrl\)\)\) \{/,
  "the aggregator must drop any listing whose URL is not absolute http(s)"
);
const guard = aggregator.slice(aggregator.indexOf("Dropped ${src.company} listing"));
assert.ok(guard.length > 0, "and must log which source produced it, so it is diagnosable");

// The guard has to sit in the loop that collects every source's records.
const loop = aggregator.slice(aggregator.indexOf("for (const o of r.value) {"));
assert.ok(
  loop.indexOf("o.sourceUrl") < loop.indexOf("isPastCycle"),
  "the URL check runs before the record is processed further"
);

console.log("Apply-URL tests passed. No listing can carry a link that resolves to Promptly.");

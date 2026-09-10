// "366 companies tracked / 5 hiring right now"
//
// Both numbers rendered on the home screen. The first was right. The second
// was counted before the live feed had been merged in, from the curated
// baseline alone, and never recomputed — so the app advertised 5 employers
// hiring while the feed it had just downloaded held live listings from 196.
//
// This badly undersells the product to the exact person it is trying to
// convince, on the first screen they see.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");

const fn = src.slice(src.indexOf("async function loadLiveOpenings()"));
const body = fn.slice(0, fn.indexOf("\n}\n"));

// The merge loop is what makes the count meaningful.
const mergeAt = body.indexOf("openings.push(item)");
assert.ok(mergeAt > 0, "the live merge loop must be findable");

// There must be a recount AFTER the merge, not only the early one that fires
// as soon as `updatedAt` is read.
const after = body.slice(mergeAt);
assert.match(after, /updateTrackedCount\(\);/,
  "the tracked count must be recomputed once live openings are merged");

// And the early call is legitimate (it refreshes the 'checked N min ago'
// line), so this is an addition, not a move.
const before = body.slice(0, mergeAt);
assert.match(before, /updateTrackedCount\(\);/,
  "the early call stays — it updates the feed timestamp line");

// The count itself must be derived from real openings, not a constant.
const counter = src.match(/function companiesWithOpenRoles\(\)[\s\S]*?\n\}/);
assert.ok(counter, "companiesWithOpenRoles must exist");
assert.match(counter[0], /openings\.filter/, "counted from the live list");
assert.match(counter[0], /isAwaitingLike/,
  "placeholder cards must not count as an employer that is hiring");
assert.match(counter[0], /new Set/, "employers, not listings — one company with 12 roles is one employer");

console.log("Tracked-count tests passed. 'Hiring right now' is recounted after the live feed arrives.");

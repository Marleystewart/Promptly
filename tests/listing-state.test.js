const assert = require("node:assert/strict");
const {
  listingIdentity,
  resolveListing,
  migrateLegacyEntries,
} = require("../listing-state.js");

const first = {
  company: "American Express",
  role: "Cybersecurity Analyst Intern",
  program: "Summer 2027",
  location: "Phoenix, AZ",
  sourceUrl: "https://careers.example.com/jobs/amex-101",
};
const second = {
  company: "American Express",
  role: "Finance Analyst Intern",
  program: "Summer 2027",
  location: "New York, NY",
  sourceUrl: "https://careers.example.com/jobs/amex-202",
};
const openings = [first, second];

assert.notStrictEqual(listingIdentity(first), listingIdentity(second), "two roles at one company need different identities");
assert.strictEqual(resolveListing(openings, listingIdentity(first)), first, "the first posting must open independently");
assert.strictEqual(resolveListing(openings, listingIdentity(second)), second, "the second posting must open independently");

const statuses = new Map([
  [listingIdentity(first), "Applied"],
  [listingIdentity(second), "Interview"],
]);
assert.strictEqual(statuses.get(listingIdentity(first)), "Applied");
assert.strictEqual(statuses.get(listingIdentity(second)), "Interview");

const saved = new Set([listingIdentity(first)]);
assert.ok(saved.has(listingIdentity(first)), "saving the first posting should affect that posting");
assert.ok(!saved.has(listingIdentity(second)), "saving the first posting must not save a sibling role");

const legacy = migrateLegacyEntries(new Map([["American Express", "Applied"]]), openings);
assert.ok(legacy.changed, "old company-level state should be migrated");
assert.strictEqual(legacy.entries.has("American Express"), false, "the shared company key must be removed");
assert.strictEqual(legacy.entries.get(listingIdentity(first)), "Applied", "legacy state belongs to only one posting");
assert.strictEqual(legacy.entries.has(listingIdentity(second)), false, "legacy state must not spread to sibling postings");

const placeholderA = { company: "Example Co", role: "Summer Analyst", program: "Summer 2027", location: "Boston" };
const placeholderB = { company: "Example Co", role: "Summer Analyst", program: "Summer 2027", location: "Chicago" };
assert.notStrictEqual(listingIdentity(placeholderA), listingIdentity(placeholderB), "URL-less listings still need independent identities");

console.log("Per-listing state tests passed.");

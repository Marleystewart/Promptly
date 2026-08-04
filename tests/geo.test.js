// Location resolution and distance.
//
// These assertions encode the product rules directly: Philadelphia must not
// return Pittsburgh, Austin must not return Dallas, and a student in a town we
// can't place must still be told what we did instead of getting silence.

const assert = require("assert");
const geo = require("../geo.js");

function miles(a, b) {
  return geo.milesBetween(geo.resolve(a), geo.resolve(b));
}

// ── Distance accuracy ─────────────────────────────────────────────────────
// Great-circle vs published road/straight-line figures; 12% tolerance covers
// the difference between city-centre points and colloquial distances.
const KNOWN = [
  ["New York, NY", "Philadelphia, PA", 80],
  ["Philadelphia, PA", "Pittsburgh, PA", 258],
  ["Boston, MA", "Providence, RI", 41],
  ["Austin, TX", "Dallas, TX", 182],
  ["Hartford, CT", "New York, NY", 100],
  ["Hartford, CT", "Springfield, MA", 24],
  ["Los Angeles, CA", "San Diego, CA", 111],
  ["Seattle, WA", "Portland, OR", 145],
  ["Chicago, IL", "Milwaukee, WI", 83],
];
for (const [from, to, expected] of KNOWN) {
  const actual = miles(from, to);
  const error = Math.abs(actual - expected) / expected;
  assert.ok(error < 0.12, `${from} -> ${to}: got ${actual.toFixed(0)}mi, expected ~${expected}mi`);
}

// Symmetry and identity — a broken haversine usually fails one of these.
assert.strictEqual(Math.round(miles("Boston, MA", "Denver, CO")), Math.round(miles("Denver, CO", "Boston, MA")));
assert.ok(miles("Boston, MA", "Boston, MA") < 0.001);

// ── The product rules from the brief ──────────────────────────────────────
assert.ok(miles("Philadelphia, PA", "Pittsburgh, PA") > 100, "Philadelphia must not reach Pittsburgh at any normal radius");
assert.ok(miles("Austin, TX", "Dallas, TX") > 100, "Austin must not reach Dallas at any normal radius");
assert.ok(miles("Boston, MA", "Portland, ME") > 75, "Boston must not reach Maine inside 75 miles");
assert.ok(miles("Boston, MA", "Providence, RI") > 25, "Providence is outside a 25-mile Boston search");

// ── Resolution ────────────────────────────────────────────────────────────
assert.strictEqual(geo.resolve("NYC").label, "New York, NY", "common aliases must resolve");
assert.strictEqual(geo.resolve("bay area").label, "San Francisco, CA");
assert.strictEqual(geo.resolve("New York, NY, USA").label, "New York, NY", "trailing USA must not break parsing");
assert.strictEqual(geo.resolve("Austin, Texas").label, "Austin, TX", "full state names must resolve");
assert.strictEqual(geo.resolve("Hartford CT").label, "Hartford, CT", "comma is optional");

// A town we don't know still resolves, but only to state precision — the UI
// depends on this flag to avoid quoting a confident distance.
const rural = geo.resolve("Cairo, Arkansas");
assert.strictEqual(rural.precision, "state", "unknown towns fall back to the state centroid");
assert.ok(rural.lat && rural.lon, "state fallback still yields usable coordinates");

// Ambiguity must be reported, never guessed.
const ambiguous = geo.resolve("Springfield");
assert.strictEqual(ambiguous.kind, "ambiguous", "a bare ambiguous city must not silently pick a state");
assert.ok(ambiguous.options.length > 1);

// Remote is a category, not a place.
assert.strictEqual(geo.resolve("Remote").kind, "remote");
assert.ok(geo.isRemoteText("Remote - US"));
assert.ok(geo.isRemoteText("Work from home"));
assert.ok(!geo.isRemoteText("Removed from consideration"), "'remote' must match as a word, not a substring");

// ── Metro fallback ────────────────────────────────────────────────────────
const wyoming = geo.nearestMetro(geo.resolve("Casper, WY"));
assert.ok(wyoming && wyoming.miles > 0, "rural locations must find a nearest metro");
assert.strictEqual(geo.nearestMetro(geo.resolve("Newark, NJ")).label, "New York, NY");

// Every state must be resolvable, or rural students in that state get nothing.
for (const state of Object.keys(geo.STATE_CENTROIDS)) {
  const point = geo.resolve(`Nowheresville, ${state}`);
  assert.ok(point && point.kind === "point", `state ${state} must resolve to a point`);
}

// Every city coordinate must be inside plausible US bounds — catches a
// transposed or sign-flipped latitude/longitude pair.
for (const [name, [lat, lon]] of Object.entries(geo.CITIES)) {
  assert.ok(lat > 18 && lat < 72, `${name} latitude ${lat} is outside US bounds`);
  assert.ok(lon < -66 && lon > -180, `${name} longitude ${lon} is outside US bounds`);
}

console.log(`Geo tests passed. ${Object.keys(geo.CITIES).length} cities, ${Object.keys(geo.STATE_CENTROIDS).length} states.`);

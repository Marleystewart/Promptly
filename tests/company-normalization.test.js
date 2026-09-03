// normalizeCompanyName() collapses spelling variants so a curated card spelled
// differently from the registry isn't wrongly shown as "we can't read their
// feed". It does that by stripping suffix words (group, partners, management,
// company, …), which is aggressive on purpose.
//
// The risk it creates: if two GENUINELY DIFFERENT employers ever normalize to
// the same key and one of them is monitored, the other inherits "we can read
// this feed" — and Promptly promises an alert it cannot deliver. That is a
// trust failure, not a cosmetic bug.
//
// So this pins the exact set of collisions. Every one below is the same firm
// spelled two ways, which is the intended behaviour. A NEW collision fails the
// build so a human decides which kind it is.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");

// Pull the real implementation out of script.js rather than copying the regex,
// so this test cannot drift away from what ships.
const source = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const aliasMatch = source.match(/const COMPANY_ALIASES = \{[\s\S]*?\n\};/);
assert.ok(aliasMatch, "COMPANY_ALIASES not found in script.js — did it get renamed?");
const match = source.match(/function normalizeCompanyName\(name\) \{[\s\S]*?\n\}/);
assert.ok(match, "normalizeCompanyName not found in script.js — did it get renamed?");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`${aliasMatch[0]}\n${match[0]}; this.fn = normalizeCompanyName; this.aliases = COMPANY_ALIASES;`, sandbox);
const normalizeCompanyName = sandbox.fn;
const COMPANY_ALIASES = sandbox.aliases;

// Sanity: the variants the fix exists to solve must actually collapse.
assert.equal(normalizeCompanyName("J.P. Morgan"), normalizeCompanyName("JPMorgan"));
assert.equal(normalizeCompanyName("Moelis & Company"), normalizeCompanyName("Moelis"));
assert.equal(normalizeCompanyName("AQR Capital Management"), normalizeCompanyName("AQR Capital"));
assert.equal(normalizeCompanyName("D. E. Shaw"), normalizeCompanyName("D.E. Shaw"));

// …and clearly different employers must NOT.
assert.notEqual(normalizeCompanyName("Morgan Stanley"), normalizeCompanyName("J.P. Morgan"));
assert.notEqual(normalizeCompanyName("Capital One"), normalizeCompanyName("AQR Capital"));
assert.notEqual(normalizeCompanyName("Blackstone"), normalizeCompanyName("BlackRock"));
assert.notEqual(normalizeCompanyName("Point72"), normalizeCompanyName("Point B"));

// Gather every company name the app knows about.
const names = new Set();

const monitoredSandbox = { window: {} };
vm.createContext(monitoredSandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "monitored.js"), "utf8"), monitoredSandbox);
const monitored = Array.from(monitoredSandbox.window.MONITORED_COMPANIES || []);
monitored.forEach((n) => names.add(n));

const { SOURCES } = require("../api/_shared/sources.js");
SOURCES.forEach((s) => names.add(s.company));

const watchlistSandbox = { window: {} };
vm.createContext(watchlistSandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "watchlist.js"), "utf8"), watchlistSandbox);
Object.keys(watchlistSandbox.window.COMPANY_DOMAINS || {}).forEach((n) => names.add(n));

const byKey = new Map();
for (const name of names) {
  const key = normalizeCompanyName(name);
  if (!byKey.has(key)) byKey.set(key, new Set());
  byKey.get(key).add(name);
}

const collisions = [...byKey.entries()]
  .filter(([, set]) => set.size > 1)
  .map(([key]) => key)
  .sort();

// Each of these is ONE firm written two ways, so collapsing them is correct and
// is the whole point of the normalizer. Add a key here only after confirming the
// names really are the same employer.
//   Reviewed 24 Aug 2026: aqrcapital, deshaw, jpmorgan, moelis, nvidia
//   Reviewed 25 Aug 2026: carlyle ("Carlyle" / "Carlyle Group"),
//                         sixthstreet ("Sixth Street" / "Sixth Street Partners")
//   Reviewed  2 Sep 2026: block ("Block (Square)" / "Block" — renamed in 2021),
//                         synchrony ("Synchrony Financial" / "Synchrony")
//                         Both come from COMPANY_ALIASES and were confirmed
//                         against the live feed: each card was showing
//                         "Awaiting 2027 posting" while its listings were
//                         already live under the other spelling.
//                         Then, found by the near-miss detector below on its
//                         first run: blueowl ("Blue Owl Capital" / "Blue Owl"),
//                         federalreserveboard ("Federal Reserve" / "Federal
//                         Reserve Board"), comcastnbcuniversal ("NBCUniversal"
//                         / "Comcast NBCUniversal" — NBCU hires through
//                         Comcast's board), and Disney. Each is monitored but
//                         returning no listings yet, so the card now reads
//                         "Awaiting 2027 posting" rather than claiming we
//                         cannot read the feed.
//                         Later the same day, once the detector learned to
//                         match whole-word prefixes: fis ("FIS Global" on the
//                         card / "FIS" in the registry). FIS is Fidelity
//                         National Information Services, whose own scraper file
//                         is named fisglobal.js — the same firm, and it had a
//                         working custom source the whole time.
const KNOWN_SAFE = [
  "aqrcapital", "block", "blueowl", "carlyle", "comcastnbcuniversal", "deshaw",
  "federalreserveboard", "fis", "jpmorgan", "moelis", "nvidia", "sixthstreet",
  "synchrony",
].sort();

assert.deepEqual(
  collisions,
  KNOWN_SAFE,
  `New company-name collision(s) detected.\n` +
  `Collapsing two names is only safe when they are the SAME employer.\n` +
  `Check each new key below: if the names are different companies, the ` +
  `unmonitored one will falsely claim Promptly can read its feed.\n` +
  `Found: ${JSON.stringify(collisions)}`
);

// No empty keys — a name that normalizes to "" would match every other empty one.
for (const [key, set] of byKey) {
  assert.notEqual(key, "", `these names normalize to an empty key: ${[...set].join(", ")}`);
}

console.log(`Company normalization tests passed. ${names.size} names, ${collisions.length} reviewed collisions.`);

// ── Near-miss detector ────────────────────────────────────────────────────────
// The normalizer only collapses names it can reconcile by stripping suffixes.
// It cannot reconcile an acronym with a legal title ("SEC" vs "Securities and
// Exchange Commission"), so a watch-list card can sit on "Awaiting 2027
// posting" while that employer's listings are already live under the other
// spelling. Three cards were doing exactly that before COMPANY_ALIASES existed,
// and the only reason anyone noticed was a manual check.
//
// This flags pairs that LOOK like the same employer but do not collapse, so the
// next one fails the build instead of sitting unnoticed. It is deliberately
// conservative — a fuzzy matcher pairs "CIA" with "Intel", because "intel" is a
// substring of "intelligence", and acting on that would be far worse than
// leaving a placeholder up.
{
  const monitoredKeys = new Map();
  monitored.forEach((name) => monitoredKeys.set(normalizeCompanyName(name), name));

  const watchlist = watchlistSandbox.window.WATCHLIST || [];
  const significant = (name) => String(name)
    .split(/[^A-Za-z]+/)
    .filter((word) => word && !/^(of|and|the|for|de|la)$/i.test(word));
  const initials = (name) => significant(name).map((w) => w[0].toUpperCase()).join("");

  const nearMisses = [];
  for (const card of watchlist) {
    const key = normalizeCompanyName(card.company);
    if (monitoredKeys.has(key)) continue; // already resolves — nothing to flag

    for (const [monitoredKey, monitoredName] of monitoredKeys) {
      // 1. One normalized name wholly contains the other. Minimum length 5 so
      //    short keys don't drag in everything that shares three letters.
      const containment = key.length >= 5 && monitoredKey.length >= 5
        && (monitoredKey.includes(key) || key.includes(monitoredKey));
      // 2. The card is an acronym of the monitored company's real words. This
      //    is what catches SEC, and it is exact rather than fuzzy: "CIA" is not
      //    the initials of "Intel".
      const acronym = /^[A-Z.&\s]{2,6}$/.test(card.company)
        && initials(card.company) === initials(monitoredName)
        && significant(card.company).length !== significant(monitoredName).length;
      // 3. The card name STARTS WITH the monitored name, as whole words:
      //    "FIS Global" against a registry entry of "FIS". Rule 1 could never
      //    catch that pair because it needs five characters on BOTH sides, and
      //    the registry name is three. Whole-word matching is what keeps this
      //    safe — a bare substring rule would pair "Related Companies" with
      //    anything containing "rel".
      const cardWords = significant(card.company).map((w) => w.toLowerCase());
      const monWords = significant(monitoredName).map((w) => w.toLowerCase());
      const wordPrefix = monWords.length > 0
        && monWords.length < cardWords.length
        && monWords.every((w, i) => cardWords[i] === w);
      if (containment || acronym || wordPrefix) nearMisses.push(`${card.company} ~ ${monitoredName}`);
    }
  }
  nearMisses.sort();

  // Each entry here has been checked and is a DIFFERENT employer, or a parent
  // company whose feed does not represent the division on the card.
  //   Reviewed 2 Sep 2026: the one entry this started with, "Blackstone Real
  //   Estate", was resolved by renaming the card rather than aliasing it. The
  //   parent feed is mostly software, audit and data roles tagged Finance, so
  //   promising real-estate alerts from it would have been wrong; the card is
  //   now plain "Blackstone" under Finance, which the feed does support.
  const REVIEWED_NOT_THE_SAME = [];

  assert.deepEqual(
    nearMisses,
    REVIEWED_NOT_THE_SAME,
    `A watch-list card looks like a monitored employer but does not resolve to it.\n` +
    `If they ARE the same employer, add an entry to COMPANY_ALIASES in script.js ` +
    `so the card stops claiming "Awaiting 2027 posting" while real listings exist.\n` +
    `If they are NOT (check carefully — "CIA" fuzzy-matches "Intel"), add the pair ` +
    `to REVIEWED_NOT_THE_SAME with a note saying why.\n` +
    `Found: ${JSON.stringify(nearMisses, null, 2)}`
  );
}

console.log("Company alias tests passed. No unexplained watch-list near-misses.");

// The placeholder rebuild must dedupe on the NORMALIZED name. It used to
// compare raw lowercase strings, so the SEC card showed "Awaiting posting"
// while four live SEC Scholars listings sat in the same feed under
// "Securities and Exchange Commission" — the student saw both at once.
{
  const rebuild = source.match(/function rebuildPlaceholders\(\)[\s\S]*?\n}/)[0];
  assert.match(rebuild, /new Set\(openings\.map\(\(o\) => normalizeCompanyName\(o\.company\)\)\)/,
    "existing openings must be keyed by normalized name");
  assert.match(rebuild, /have\.has\(normalizeCompanyName\(c\.company\)\)/,
    "watch-list cards must be looked up by normalized name");
  assert.doesNotMatch(rebuild, /company\.toLowerCase\(\)/,
    "a raw lowercase comparison reintroduces the duplicate-card bug");
}

console.log("Placeholder dedupe tests passed.");

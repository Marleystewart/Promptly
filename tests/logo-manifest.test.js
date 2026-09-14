// A logo path must point at a file that exists.
//
// The aggregator used to emit assets/logos/<slug>.png for every listing and let
// the browser discover the truth. In the live feed that meant 73 of 121 paths
// pointed at files not in the repo, so a page load fired dozens of doomed image
// requests and leaned on an error handler to tidy up. One slug was undefined,
// producing assets/logos/undefined.png.
//
// The manifest is generated, so the failure mode is that it goes stale: someone
// adds a logo and never regenerates, or deletes one and the manifest still
// promises it. Both are asserted here.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { LOGO_FILES, LOGO_ALIASES, LOGO_BY_NAME, logoPathFor } = require("../api/_shared/logo-manifest");

const DIR = path.join(__dirname, "..", "assets", "logos");
const onDisk = new Set(fs.readdirSync(DIR).filter((f) => /\.(png|jpg|jpeg|svg|webp)$/i.test(f)));

// 1. The manifest matches the directory, in both directions.
const promisedButMissing = [...LOGO_FILES].filter((f) => !onDisk.has(f));
assert.deepEqual(promisedButMissing, [],
  "manifest lists files that are not in assets/logos — run scripts/generate-logo-manifest.js");

const presentButUnlisted = [...onDisk].filter((f) => !LOGO_FILES.has(f));
assert.deepEqual(presentButUnlisted, [],
  "assets/logos has files the manifest does not know about — run scripts/generate-logo-manifest.js");

// 2. Every alias resolves to a real file. An alias is the one place a typo
//    cannot be caught by the directory comparison above.
for (const [slug, file] of Object.entries(LOGO_ALIASES)) {
  assert.ok(onDisk.has(file), `alias ${slug} -> ${file} points at a file that does not exist`);
}

// 3. A slug with no file returns "" rather than a path that will 404.
assert.equal(logoPathFor("definitely-not-an-employer"), "");
assert.equal(logoPathFor(""), "");
assert.equal(logoPathFor(undefined), "", "an undefined slug must not become undefined.png");
assert.equal(logoPathFor(null), "");

// 4. A slug with a file returns it, case-insensitively.
const sample = [...LOGO_FILES][0].replace(/\.png$/, "");
assert.equal(logoPathFor(sample), "assets/logos/" + sample + ".png");
assert.equal(logoPathFor(sample.toUpperCase()), "assets/logos/" + sample + ".png");

// 5. Aliases win over a same-named file, which is the whole point of them.
for (const [slug, file] of Object.entries(LOGO_ALIASES)) {
  assert.equal(logoPathFor(slug), "assets/logos/" + file);
}

// 6. The company-name fallback. A third of the feed comes from sources with no
//    ATS board slug, so before this every one of them asked for
//    assets/logos/undefined.png. Punctuation must not defeat the match:
//    "Goldman Sachs" has to find goldman-sachs.png, and extension must not
//    either — Mayo Clinic's file is a .jpeg.
for (const file of Object.values(LOGO_BY_NAME)) {
  assert.ok(onDisk.has(file), `name index points at ${file}, which is not in assets/logos`);
}

if (LOGO_BY_NAME.goldmansachs) {
  assert.equal(logoPathFor(undefined, "Goldman Sachs"), "assets/logos/" + LOGO_BY_NAME.goldmansachs,
    "a listing with no ATS slug must still find its logo by company name");
}

assert.equal(logoPathFor(undefined, "An Employer We Have No Logo For"), "");
assert.equal(logoPathFor(undefined, undefined), "",
  "no slug and no company must yield no path, never undefined.png");

// The slug still wins when both could match, because it is the more specific
// signal — two employers can share a display name, not a board token.
assert.equal(logoPathFor("cat", "Caterpillar"), "assets/logos/caterpillar.png");

console.log(`Logo manifest tests passed. ${LOGO_FILES.size} files, ${Object.keys(LOGO_ALIASES).length} aliases, no path can 404.`);

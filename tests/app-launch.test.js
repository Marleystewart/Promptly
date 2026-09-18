// The iOS app must open on the SAME screen the website opens on.
//
// It did not. The website's launch screen is the app icon with the Promptly
// wordmark under it (index.html, .launch-screen). The native shell covered that
// with its own artwork — the bolt alone, no wordmark — and because the cover is
// only lifted once the session and feed have resolved, the real launch screen
// underneath had already been passed by the time anyone could see it. Two
// platforms, two different openings, from one codebase.
//
// The cover now renders the website's own lockup: same files, same classes.
//
// The trap this file exists to catch: index.html's <style> block paints before
// styles.css loads, so it is tempting to restate the sizes there. An inline
// copy is MORE specific than the media query in styles.css, so it silently wins
// and the cover stops matching the screen it is imitating. That is not
// hypothetical — a first attempt gave the cover 34px corners against the site's
// 28px. styles.css owns the lockup's appearance; this block owns nothing but
// the ground it sits on.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

// Assert against declarations, not the prose explaining them.
const htmlCss = html.replace(/\/\*[\s\S]*?\*\//g, "");

// ── 1. Same artwork, same classes, on both platforms ───────────────────────
const cover = (html.match(/<div class="boot-cover"[\s\S]*?<\/div>\s*<\/div>/) || [])[0];
assert.ok(cover, "the native boot cover must still exist");
for (const cls of ["launch-icon", "launch-wordmark"]) {
  assert.match(cover, new RegExp(`class="${cls}"`),
    `the cover must reuse .${cls}, so styles.css styles it exactly as it styles the website's launch screen`);
}
assert.match(cover, /src="assets\/app-icon\.png"/, "the cover must use the site's own icon file");
assert.match(cover, /src="assets\/wordmark\.png"/, "the cover must show the Promptly wordmark, not the bolt on its own");

// The launch screen it is imitating must still be built from the same two files.
const launch = (html.match(/<div class="launch-screen[\s\S]*?<\/div>/) || [])[0];
assert.ok(launch, "the website's launch screen must still exist");
for (const src of ["assets/app-icon.png", "assets/wordmark.png"]) {
  assert.ok(launch.includes(src) && cover.includes(src),
    `${src} must be used by BOTH the cover and the launch screen, or they have drifted apart`);
}

// ── 2. The inline block must not restate what styles.css owns ──────────────
// This is the whole failure mode: inline wins over the media query.
const bootBlock = (htmlCss.match(/html\.native-app \.boot-cover[\s\S]*?html\.native-app\.app-booting body/) || [])[0] || "";
for (const prop of ["border-radius", "box-shadow", "filter"]) {
  assert.doesNotMatch(
    bootBlock,
    new RegExp(`\\.launch-(?:icon|wordmark)[^}]*${prop}\\s*:`),
    `the cover must not restate ${prop} for the launch artwork — styles.css owns it, and an inline copy outranks its media query`
  );
}
assert.doesNotMatch(
  bootBlock,
  /\.launch-(?:icon|wordmark)[^}]*\bwidth\s*:/,
  "the cover must not restate the artwork's width; .launch-icon is clamped responsively in styles.css"
);

// ── 3. The artwork is fetched before it is needed ──────────────────────────
for (const src of ["assets/app-icon.png", "assets/wordmark.png"]) {
  assert.match(
    html,
    new RegExp(`<link rel="preload" as="image" href="${src.replace("/", "\\/")}"`),
    `${src} paints in the cover's first frame, so it must be preloaded`
  );
}

// ── 4. The ground still matches the iOS launch image ───────────────────────
// The hand-off from ios/App/App/Assets.xcassets/Splash must not be a colour
// change, whatever sits on top of it.
assert.match(htmlCss, /background: radial-gradient\([^;]*#fafafc/,
  "the cover's ground must stay the splash's #fafafc with its glow");

console.log("App launch tests passed. The app opens on the website's own launch lockup.");

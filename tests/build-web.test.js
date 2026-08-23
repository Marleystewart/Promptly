// The native bundle manifest must stay in sync with what index.html actually loads.
//
// Capacitor ships the contents of www/ into the app binary. A file that
// index.html references but build-web.js doesn't copy is not a build error —
// it's a 404 inside the app, which typically renders as a blank screen on a
// real device and nowhere else. That failure mode is invisible on the web,
// where Vercel serves the repo root and every file is present by definition.
//
// So: anything index.html loads must be staged, and nothing server-side may leak
// into the bundle.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { WEB_FILES, WEB_DIRS } = require("../scripts/build-web");

const root = path.join(__dirname, "..");

// 1. Every declared file really exists.
for (const file of [...WEB_FILES, ...WEB_DIRS]) {
  assert.ok(fs.existsSync(path.join(root, file)), `build-web.js lists "${file}" but it is not in the repo`);
}

// 2. Everything index.html references locally is staged.
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const staged = new Set(WEB_FILES);

const referenced = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((ref) => !/^(https?:|mailto:|tel:|data:|#)/.test(ref))
  // Strip the ?v= cache-busting suffix and any leading slash.
  .map((ref) => ref.split("?")[0].replace(/^\//, ""))
  .filter(Boolean);

for (const ref of referenced) {
  // Extensionless hrefs are Vercel cleanUrls routes (/privacy -> privacy.html).
  const candidate = path.extname(ref) ? ref : `${ref}.html`;

  // Files inside a staged directory (assets/...) come along with the directory.
  if (WEB_DIRS.some((dir) => candidate.startsWith(`${dir}/`))) continue;

  assert.ok(
    staged.has(candidate),
    `index.html loads "${candidate}" but build-web.js does not stage it — it would 404 inside the native app`
  );
}

// 3. Nothing server-side may be declared as a web asset.
for (const file of [...WEB_FILES, ...WEB_DIRS]) {
  assert.ok(
    !/^(api|tests|scripts|node_modules|docs)\b/.test(file),
    `build-web.js must not stage server-side path "${file}" into the app bundle`
  );
}

// 4. The service worker's precache must also be staged, for the same reason.
const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const shell = [...sw.matchAll(/"(\/[^"]*)"/g)]
  .map((m) => m[1].replace(/^\//, ""))
  .filter((ref) => ref && path.extname(ref));

for (const ref of shell) {
  if (WEB_DIRS.some((dir) => ref.startsWith(`${dir}/`))) continue;
  assert.ok(
    staged.has(ref),
    `service-worker.js precaches "${ref}" but build-web.js does not stage it`
  );
}

console.log(`Web bundle manifest in sync. ${WEB_FILES.length} files + ${WEB_DIRS.length} dir(s).`);

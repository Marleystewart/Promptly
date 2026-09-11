// Every script the browser loads must actually parse.
//
// This exists because a broken edit shipped past a green suite. A bad
// string-slice replacement inserted a function fragment at the top of
// onboarding.js, leaving an unterminated block. `node --check` caught it
// instantly — but nothing in the suite ran `node --check`, and no test loaded
// that file, so all 61 suites passed on a file the browser could not execute.
//
// A syntax error in a client script is total: the whole file fails to
// evaluate, so every feature in it silently disappears. That is exactly the
// class of failure a test suite should never let through.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");

// Read the scripts the pages actually load, rather than a hand-kept list that
// would drift the moment someone adds a file.
const referenced = new Set();
for (const page of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  for (const [, src] of html.matchAll(/<script[^>]+src="([^"?]+\.js)[^"]*"/g)) {
    if (src.startsWith("http")) continue; // third-party, not ours to parse
    referenced.add(src.replace(/^\.?\//, ""));
  }
}

assert.ok(referenced.size > 0, "no local scripts found — did the markup change?");

const checked = [];
for (const file of [...referenced].sort()) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) {
    assert.fail(`${file} is loaded by a page but does not exist`);
  }
  const source = fs.readFileSync(full, "utf8");
  try {
    // Compiles without running: catches syntax errors without needing a DOM.
    new vm.Script(source, { filename: file });
  } catch (error) {
    assert.fail(`${file} does not parse: ${error.message}`);
  }
  checked.push(file);
}

// The service worker is loaded by the browser too, just not via a script tag.
const sw = "service-worker.js";
try {
  new vm.Script(fs.readFileSync(path.join(ROOT, sw), "utf8"), { filename: sw });
  checked.push(sw);
} catch (error) {
  assert.fail(`${sw} does not parse: ${error.message}`);
}

console.log(`Client script parse tests passed. ${checked.length} files compile.`);

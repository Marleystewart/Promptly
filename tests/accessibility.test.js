// Static WCAG 2.1 AA checks on the shipped markup.
//
// Accessibility is a genuine legal exposure in the US, and a harder one than it
// looks for Promptly specifically: the growth strategy is selling to schools,
// and public universities have their own conformance obligations that they pass
// on to vendors as a procurement question. "Does your product meet WCAG 2.1
// AA?" is asked before a contract, not after a complaint.
//
// A live audit of the running app found 0 critical and 0 serious issues. These
// checks cover the parts that can regress silently in markup — an automated
// pass never proves conformance on its own, but a regression here is always
// real.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
// index.html is a single-page app: each onboarding step and the app shell has
// its own h1, but only one is ever rendered — the rest sit inside a container
// that is display:none. Static analysis cannot see that, so heading STRUCTURE
// is checked live (0 issues at time of writing) and only the checks that hold
// regardless of view are applied to it here.
const STATIC_PAGES = ["privacy.html", "terms.html", "how-it-works.html"];
const ALL_PAGES = ["index.html", ...STATIC_PAGES];

for (const page of ALL_PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  const label = page;

  // 3.1.1 Language of Page (A)
  assert.match(html, /<html[^>]+lang=/, `${label}: <html> needs a lang attribute`);

  // 1.3.1 Info and Relationships (A)
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  assert.ok(h1s >= 1, `${label}: needs at least one h1`);

  // 1.1.1 Non-text Content (A). alt="" is fine and means "decorative" — the
  // failure is an image with no alt attribute at all.
  for (const tag of html.match(/<img\b[^>]*>/g) || []) {
    assert.match(tag, /\salt=/, `${label}: <img> without alt — ${tag.slice(0, 70)}`);
  }

  // NOT checked here: 4.1.2 accessible names on buttons.
  //
  // Several controls have their label written by JavaScript immediately before
  // being shown — the month stepper names the month, the "I have more — add N
  // matches" control names its own count. Statically they look nameless and
  // always will. Two attempts to encode this ended in false positives, and the
  // only honest options were an allowlist that would rot or a check that cries
  // wolf, so this belongs in a live audit instead. The live pass over the
  // running app found 0 controls without an accessible name; re-run it after
  // changing any control that renders its own label.
}

// Heading order, on the pages where every heading is always rendered.
for (const page of STATIC_PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${page}: expected exactly one h1`);
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  let previous = 0;
  for (const level of levels) {
    assert.ok(!(previous && level > previous + 1),
      `${page}: heading jumps from h${previous} to h${level}; screen-reader users navigate by these`);
    previous = level;
  }
}

// 2.4.1 Bypass Blocks (A). The app header and its action buttons repeat on
// every view, so without this a keyboard user tabs through them on every
// navigation. It must also be the FIRST focusable thing, or it does not help:
// it originally sat below the verification banner's "Resend link" button.
{
  const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.match(index, /class="skip-link" href="#main-content"/, "index.html needs a skip link");
  assert.match(index, /id="main-content"/, "the skip link needs its target");
  assert.ok(
    index.indexOf('class="skip-link"') < index.indexOf('class="verify-banner"'),
    "the skip link must come before the verification banner, or it is not the first focusable element"
  );

  const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
  assert.match(css, /\.skip-link\s*\{[\s\S]*left:\s*-9999px/, "the skip link must be off-screen until focused");
  assert.match(css, /\.skip-link:focus\s*\{[\s\S]*left:\s*0/, "and must become visible when focused");
  // 1.4.3 (AA): white on --purple is 4.44:1, just under the required 4.5.
  assert.match(css, /background:\s*var\(--purple-2\)/, "the skip link must use the darker purple to clear 4.5:1");
}

// 2.3.3 / 2.2.2 — motion must respect the OS setting.
{
  const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
  assert.match(css, /@media \(prefers-reduced-motion/, "animations must respect prefers-reduced-motion");
}

console.log(`Accessibility tests passed. ${ALL_PAGES.length} pages checked against WCAG 2.1 A/AA basics.`);

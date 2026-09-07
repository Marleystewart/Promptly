// Colour contrast, measured rather than eyeballed.
//
// Three tokens were sitting just under WCAG AA (4.5:1 for normal text) — close
// enough to look completely fine and still fail for anyone reading on a phone
// in daylight:
//
//   --faint 0.42        3.93:1 on the panels it sits on
//   --purple as text    4.49:1 on the background
//   white on --purple   4.44:1 inside a primary button
//
// The last two pull in opposite directions: text on dark wants a LIGHTER
// purple, white on a fill wants a DARKER one. Hence --purple-ink and
// --purple-cta, with --purple itself left alone for borders and glows where
// contrast is not judged.
//
// Asserted here because "it looks fine" is exactly how it got here.

const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `--${name} is missing from styles.css`);
  return match[1].trim();
}

function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const rgba = value.match(/rgba?\(([^)]+)\)/);
  assert.ok(rgba, `cannot parse colour: ${value}`);
  const parts = rgba[1].split(",").map((p) => parseFloat(p.trim()));
  return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
}

const relLuminance = ([r, g, b]) => {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

function contrast(fg, bg) {
  const [l1, l2] = [relLuminance(fg), relLuminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Flatten a translucent colour onto whatever is behind it. A ratio computed
// against the raw rgba value rather than the composite is meaningless, and is
// the mistake that makes this kind of check pass when it should not.
function over(color, backdrop) {
  const [r, g, b, a] = color;
  return [r, g, b].map((c, i) => Math.round(c * a + backdrop[i] * (1 - a)));
}

const AA = 4.5;
const bg = parseColor(token("bg")).slice(0, 3);
const panel = over(parseColor(token("panel")), bg);
const panelStrong = over(parseColor(token("panel-strong")), bg);
const white = [255, 255, 255];

const checks = [
  ["--ink on --bg", over(parseColor(token("ink")), bg), bg],
  ["--muted on --bg", over(parseColor(token("muted")), bg), bg],
  ["--muted on --panel-strong", over(parseColor(token("muted")), panelStrong), panelStrong],
  ["--faint on --bg", over(parseColor(token("faint")), bg), bg],
  ["--faint on --panel", over(parseColor(token("faint")), panel), panel],
  ["--faint on --panel-strong", over(parseColor(token("faint")), panelStrong), panelStrong],
  ["--purple-ink as text on --bg", parseColor(token("purple-ink")).slice(0, 3), bg],
  ["white on --purple-cta", white, parseColor(token("purple-cta")).slice(0, 3)],
  ["white on --purple-2", white, parseColor(token("purple-2")).slice(0, 3)],
];

const failures = [];
for (const [label, fg, backdrop] of checks) {
  const ratio = contrast(fg, backdrop);
  if (ratio < AA) failures.push(`${label} is ${ratio.toFixed(2)}:1, needs ${AA}:1`);
}
assert.deepEqual(failures, [], `Contrast below WCAG AA:\n  ${failures.join("\n  ")}`);

// The brand purple stays available for borders and glows, where contrast is
// not judged — but it must never come back as small text or a button fill,
// which is the state this test exists to prevent.
assert.ok(
  !/\.eyebrow\s*\{[^}]*color:\s*var\(--purple\)\s*;/.test(css),
  ".eyebrow is using --purple as text again; it measures 4.49:1 and fails AA",
);
assert.ok(
  !/linear-gradient\(135deg,\s*var\(--purple\),\s*var\(--purple-2\)\)/.test(css),
  "a primary button gradient starts at --purple again; white on it is 4.44:1 and fails AA",
);

console.log(`Contrast tests passed. ${checks.length} token pairs checked against WCAG AA.`);

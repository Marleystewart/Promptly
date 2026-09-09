// Why nobody turned on alerts.
//
// The first 17 accounts all confirmed their email and all became eligible for
// alerts. Zero enabled push. That is not 17 people deciding they don't want
// notifications from a notification app — the only way to turn them on was a
// button inside Profile > Settings, two taps down a tab students never opened.
//
// These assertions cover the parts that would fail quietly: showing the invite
// to someone who already answered, and offering an Enable button on a platform
// that will refuse it.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");

// ── It has to be where students actually are ─────────────────────────────
// Inside the openings feed, not the profile tab that hid it in the first place.
const feed = html.slice(html.indexOf('id="view-openings"'), html.indexOf('id="view-cycles"'));
assert.match(feed, /data-push-invite/, "the invite must live on the feed, not in Profile > Settings");
assert.match(html, /data-push-invite[^>]*hidden/, "it starts hidden and is shown only when it applies");

// The settings control stays. This adds a route in, it does not move the switch.
assert.match(html, /data-enable-push/, "the settings button must remain for anyone who changes their mind");

const render = script.match(/function renderPushInvite\(\)[\s\S]*?\n\}/);
assert.ok(render, "renderPushInvite must exist");
const body = render[0];

// ── Who sees it ──────────────────────────────────────────────────────────
assert.match(body, /authUser/, "only signed-in students");
assert.match(body, /profile\.pushNotifications !== false/,
  "someone who deliberately switched push off is never asked again");
assert.match(body, /!pushAlreadyOn\(\)/, "nobody who already granted permission is asked");
assert.match(body, /!pushInviteDismissed\(\)/, "dismissing it is permanent");

// ── The iPhone honesty rule ──────────────────────────────────────────────
// On iOS in Safari, web push does not exist until the app is on the Home
// Screen. An Enable button there is a button that cannot work.
assert.match(body, /isIOSDevice\(\) && !isStandaloneApp\(\)/,
  "iOS-outside-the-Home-Screen has to be detected");
const iosBranch = body.slice(body.indexOf("needsInstall"));
const enableIndex = body.indexOf("data-push-invite-enable");
const ternaryIndex = body.indexOf("needsInstall\n") >= 0 ? body.indexOf("needsInstall\n") : body.indexOf("? `");
assert.ok(enableIndex > ternaryIndex,
  "the Enable button must sit on the non-install branch, not be offered on iOS Safari");
assert.match(iosBranch, /Add to Home Screen/, "iOS students get the instruction that actually works");

// ── Answering it, either way, ends it ────────────────────────────────────
const handler = script.match(/const pushInviteEnable = event\.target\.closest[\s\S]*?\n  \}/);
assert.ok(handler, "the enable button must be wired");
assert.match(handler[0], /await enablePushAlerts\(\)/, "it calls the same path the settings button does");
assert.match(handler[0], /else dismissPushInvite\(\)/,
  "a refused or dismissed permission prompt must not re-ask on every load");

// A permission request must be reachable from the tap itself — iOS drops the
// user-gesture context across anything awaited first.
assert.ok(
  handler[0].indexOf("await enablePushAlerts()") < handler[0].indexOf("renderPushInvite()"),
  "nothing may be awaited before the permission request"
);

// ── It is an offer, not an alarm ─────────────────────────────────────────
// The verification bar we deleted warned about a state production could not
// reach, and its only action was a promise we could not keep. This one must not
// read like that.
assert.match(css, /\.push-invite \{[\s\S]*?background: var\(--purple-soft\)/,
  "the invite uses the accent surface, never a warning colour");
for (const scary of ["--red", "--amber", "--danger", "--warning"]) {
  const rule = css.slice(css.indexOf(".push-invite {"));
  assert.ok(!rule.slice(0, 900).includes(scary), `the invite must not use ${scary}`);
}
assert.ok(!body.includes("deleted") && !body.includes("expire"),
  "no deadline or deletion threat: not finding a settings tab is not the student's mistake");

console.log("Push onboarding tests passed. Asked once, where students are, and never where it cannot work.");

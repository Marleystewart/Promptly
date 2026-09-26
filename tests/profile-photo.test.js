// Profile photo storage.
//
// The photo moved from device-only to account-scoped on 19 Sep 2026 so it
// follows a student to a new phone. That move traded a simple privacy promise
// ("never leaves this device") for a harder one ("only you can read it, and it
// dies with your account"). These assertions pin the harder promise, because
// it is the kind that decays quietly.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const script = fs.readFileSync(path.join(ROOT, "script.js"), "utf8");
const subscribe = fs.readFileSync(path.join(ROOT, "api/subscribe.js"), "utf8");
const migration = fs.readFileSync(
  path.join(ROOT, "supabase/migrations/20260919_avatar_storage.sql"), "utf8");
const privacy = fs.readFileSync(path.join(ROOT, "privacy.html"), "utf8");
const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

// ── The image must never ride in the JWT ────────────────────────────────────
// user_metadata is embedded in the access token. A data URL there would be
// attached to every authenticated request the app makes, and would grow the
// header until requests start failing.
const accountStart = script.indexOf("function accountProfile(");
const accountEnd = script.indexOf("\n}\n", accountStart);
assert.ok(accountStart >= 0, "accountProfile must exist");
// Comments are stripped first: this asserts on what the function actually
// serializes, not on prose that happens to name the field.
const stripComments = (code) => code.replace(/^\s*\/\/.*$/gm, "");
const accountPayload = stripComments(script.slice(accountStart, accountEnd));
assert.doesNotMatch(accountPayload, /photoDataUrl/,
  "the image itself must never go into user_metadata — it rides in the JWT");
assert.match(accountPayload, /photoUpdatedAt/,
  "the stamp must be in the account profile, or another device never knows to fetch");

// ── The bucket is private and per-user ──────────────────────────────────────
assert.match(migration, /'avatars',\s*'avatars',\s*false/,
  "the avatars bucket must be private — a public one exposes every photo to anyone with a UUID");
for (const op of ["select", "insert", "update", "delete"]) {
  assert.match(migration, new RegExp(`create policy "avatar_${op}_own"`),
    `${op} must be authorized explicitly, not folded into a permissive catch-all`);
}
// Every policy authorizes on the caller's own id in the first path segment.
// Four occurrences: one each for select/insert/delete, two for update
// (using + with check), minus none — count the guard itself.
const ownershipGuards = migration.match(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/g) || [];
assert.equal(ownershipGuards.length, 5,
  "each policy must scope to the caller's own folder (update needs both using and with check)");

// ── Deletion must reach the photo ───────────────────────────────────────────
// Deleting an auth user does not cascade to Storage. Without this the image
// outlives the account, which is exactly the gap the August audit closed once.
assert.match(subscribe, /storage\/v1\/object\/avatars\//,
  "account deletion must remove the stored photo");
const avatarDeleteIndex = subscribe.indexOf("storage/v1/object/avatars/");
const authDeleteIndex = subscribe.indexOf("auth/v1/admin/users/");
assert.ok(avatarDeleteIndex < authDeleteIndex,
  "delete the photo before the user, or there is no id left to build the path from");

// The student can also remove it without deleting the account.
assert.match(script, /async function removeProfilePhoto\(\)/,
  "removing a photo must be possible on its own");
assert.match(script, /\.from\(AVATAR_BUCKET\)\s*\.remove\(\[path\]\)/,
  "removing the photo must delete the stored object, not just the local copy");

// ── The claims on screen must match the code ────────────────────────────────
// These pages said the photo never leaves the device. Shipping the upload
// without rewriting them would have made the app misrepresent itself.
assert.doesNotMatch(privacy, /profile photo[\s\S]{0,120}never leaves this device/i,
  "privacy.html must not still claim the photo never leaves the device");
assert.doesNotMatch(index, /profile photo never leaves this device/i,
  "index.html must not still claim the photo never leaves the device");
assert.match(privacy, /private store that only your own signed-in account can read/i,
  "privacy.html must describe where the photo actually goes");

// Application progress is genuinely still device-only. It is the remaining
// half of the old promise and must not be quietly swept along with the photo.
assert.match(privacy, /application progress[\s\S]{0,200}stays in your\s*\n?\s*browser/i,
  "application progress must still be documented as device-only");
const alertStart = script.indexOf("function serverAlertProfile(");
const alertPayload = stripComments(script.slice(alertStart, script.indexOf("\n}\n", alertStart)));
assert.doesNotMatch(alertPayload, /photoDataUrl|photoUpdatedAt/,
  "the alert store has no use for the photo and must not receive it");

console.log("Profile photo tests passed. Private per-user bucket, no image in the JWT, deleted with the account.");

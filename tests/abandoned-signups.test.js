// Deleting real user accounts, so the guards matter more than the feature.
//
// Promptly's banner tells every unconfirmed student "Unconfirmed profiles are
// deleted after 14 days". That could not happen for the case it describes:
// purgeUnverified walks Upstash subscriber records, but /api/subscribe requires
// a CONFIRMED email, so an abandoned signup never gets an Upstash record at all.
// Their Supabase account — email address and name — stayed indefinitely.

const assert = require("node:assert/strict");
const { isAbandoned, usersFrom, UNCONFIRMED_DAYS, MAX_DELETES_PER_RUN } = require("../api/_shared/abandoned-signups");

const NOW = Date.parse("2026-09-03T00:00:00Z");
const daysAgo = (n) => new Date(NOW - n * 86400000).toISOString();
const user = (over = {}) => ({ id: "u1", email: "a@x.edu", created_at: daysAgo(30), ...over });

// ── What counts as abandoned ────────────────────────────────────────────────
assert.equal(isAbandoned(user(), NOW), true, "old and never confirmed");

// Any confirmation signal at all disqualifies it. Three separate fields,
// because a mismatch between them must never cost someone their account.
for (const proof of ["email_confirmed_at", "confirmed_at", "last_sign_in_at"]) {
  assert.equal(
    isAbandoned(user({ [proof]: daysAgo(20) }), NOW), false,
    `${proof} proves the account is real and must protect it`
  );
}

// Inside the promised window, it stays.
assert.equal(isAbandoned(user({ created_at: daysAgo(13) }), NOW), false, "day 13 is not yet due");
assert.equal(isAbandoned(user({ created_at: daysAgo(14) }), NOW), true, "day 14 is what we promised");
assert.equal(UNCONFIRMED_DAYS, 14, "the code must match the number shown to students");

// Malformed rows are never deleted — an unreadable date is not evidence of age.
for (const bad of [null, {}, user({ id: null }), user({ email: "" }), user({ created_at: "" }), user({ created_at: "nonsense" })]) {
  assert.equal(isAbandoned(bad, NOW), false, `must not delete on incomplete data: ${JSON.stringify(bad)}`);
}

// ── Response shapes ─────────────────────────────────────────────────────────
// Supabase has returned both across versions; reading the wrong one silently
// sweeps nothing, which looks identical to "there was nothing to sweep".
assert.equal(usersFrom([{ id: "a" }]).length, 1, "bare array");
assert.equal(usersFrom({ users: [{ id: "a" }, { id: "b" }] }).length, 2, "wrapped");
assert.equal(usersFrom(null).length, 0);
assert.equal(usersFrom({}).length, 0);

// ── The blast radius ────────────────────────────────────────────────────────
assert.ok(MAX_DELETES_PER_RUN <= 50, "a bug must not be able to empty the project in one night");

// The Upstash cross-check must be a veto, and a FAILED check must also be a
// veto — not silently treated as "no record, go ahead".
{
  const src = require("fs").readFileSync(require("path").join(__dirname, "..", "api/_shared/abandoned-signups.js"), "utf8");
  assert.match(src, /if \(record && record\.verified === true\) \{ skipped \+= 1; continue; \}/,
    "a confirmed subscriber must veto deletion");
  assert.match(src, /catch \{\s*\n\s*skipped \+= 1; \/\/ could not check — do not delete on a failed check/,
    "an errored check must veto deletion too");
  assert.match(src, /if \(user\.email_confirmed_at \|\| user\.confirmed_at \|\| user\.last_sign_in_at\) return false;/);
}

console.log("Abandoned-signup tests passed. Guards hold; the 14-day promise is now real.");

// ── End to end against a fake Supabase ──────────────────────────────────────
// The unit checks above pass even if the sweep never calls DELETE, so drive the
// real function and assert on exactly which accounts it removed.
(async () => {
  const { sweepAbandonedSignups } = require("../api/_shared/abandoned-signups");
  process.env.SUPABASE_URL = "https://fake.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";

  const users = [
    { id: "abandoned", email: "gone@x.edu", created_at: daysAgo(30) },
    { id: "recent",    email: "new@x.edu",  created_at: daysAgo(3) },
    { id: "confirmed", email: "real@x.edu", created_at: daysAgo(30), email_confirmed_at: daysAgo(29) },
    { id: "disputed",  email: "odd@x.edu",  created_at: daysAgo(30) },
  ];
  const deletedIds = [];
  const realFetch = global.fetch;
  global.fetch = async (url, opts = {}) => {
    if (String(url).includes("/admin/users?")) {
      return { ok: true, json: async () => ({ users }) };
    }
    if (opts.method === "DELETE") {
      deletedIds.push(String(url).split("/").pop());
      return { ok: true };
    }
    return { ok: false };
  };

  // "disputed" looks abandoned to Supabase but Promptly holds a CONFIRMED
  // subscriber for it. The tie must go to keeping the account.
  const result = await sweepAbandonedSignups({
    now: NOW,
    getSubscriber: async (email) => (email === "odd@x.edu" ? { verified: true } : null),
  });

  global.fetch = realFetch;

  assert.deepEqual(deletedIds, ["abandoned"], "only the genuinely abandoned account is deleted");
  assert.equal(result.deleted, 1);
  assert.equal(result.skipped, 1, "the disputed account is skipped, not deleted");
  assert.equal(result.scanned, 4);
  assert.ok(!deletedIds.includes("confirmed"), "a confirmed account is never touched");
  assert.ok(!deletedIds.includes("recent"), "an account inside the 14-day window is never touched");
  assert.ok(!deletedIds.includes("disputed"), "a disagreement between the two systems keeps the account");

  console.log("Abandoned-signup sweep tests passed. Only the abandoned account was deleted.");
})().catch((e) => { console.error(e); process.exit(1); });

// The founder dashboard counts Supabase accounts, not just synced profiles.
// It said 27 while Supabase held 49: unconfirmed and unfinished signups were
// invisible, and the list stopped at 20.
const assert = require("node:assert/strict");
const { mergeAccounts } = require("../api/_shared/auth-accounts");

const users = [
  { id: "1", email: "Confirmed@School.edu", created_at: "2026-09-10T00:00:00Z", email_confirmed_at: "2026-09-10T01:00:00Z" },
  { id: "2", email: "unconfirmed@gmail.com", created_at: "2026-09-12T00:00:00Z" },
  { id: "3", email: "noprofile@nyu.edu", created_at: "2026-09-11T00:00:00Z", email_confirmed_at: "2026-09-11T01:00:00Z" },
  { id: "4", email: "confirmed@school.edu", created_at: "2026-09-09T00:00:00Z" }, // duplicate by case
];
const subscribers = [
  { email: "confirmed@school.edu", school: "Trinity", verified: true, emailNotifications: true },
  { email: "legacy@local.com", school: "—", verified: false },
];
const { rows, summary } = mergeAccounts(users, subscribers, { pushState: () => "web" });

assert.deepEqual(summary, { total: 3, confirmed: 2, unconfirmed: 1, withProfile: 1, withoutProfile: 2, profilesWithoutAccount: 1 });
assert.equal(rows.length, 4, "every account plus the orphan profile, nothing capped");
assert.equal(rows[0].email, "unconfirmed@gmail.com", "newest first");
assert.equal(rows.find((r) => r.email === "confirmed@school.edu").school, "Trinity", "profile joined by email, case-insensitive");
assert.equal(rows.find((r) => r.email === "legacy@local.com").noAccount, true);

// A .edu address with no profile still has a school — inferred, and labelled.
{
  const withPeers = mergeAccounts(
    [{ email: "new@trincoll.edu", created_at: "2026-09-13T00:00:00Z" }, { email: "solo@nyu.edu", created_at: "2026-09-13T00:00:00Z" }, { email: "x@gmail.com", created_at: "2026-09-13T00:00:00Z" }],
    [{ email: "peer1@trincoll.edu", school: "Trinity College" }, { email: "peer2@trincoll.edu", school: "Trinity College" }, { email: "peer3@trincoll.edu", school: "Trinity" }],
  ).rows;
  const school = (email) => withPeers.find((r) => r.email === email).school;
  assert.equal(school("new@trincoll.edu"), "Trinity College (from email)", "most common school entered on that domain");
  assert.equal(school("solo@nyu.edu"), "nyu.edu (from email)", "otherwise the domain itself");
  assert.equal(school("x@gmail.com"), "—", "a personal address stays unknown");
  assert.equal(school("peer1@trincoll.edu"), "Trinity College", "an entered school is never overwritten");
}

// Supabase unreachable: fall back to profiles, not zero.
assert.equal(mergeAccounts([], subscribers).summary.total, 2);

console.log("Admin account tests passed. Counts come from Supabase accounts, every account listed.");

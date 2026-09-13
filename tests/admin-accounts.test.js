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

// Supabase unreachable: fall back to profiles, not zero.
assert.equal(mergeAccounts([], subscribers).summary.total, 2);

console.log("Admin account tests passed. Counts come from Supabase accounts, every account listed.");

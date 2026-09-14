// Retention cohorts, and the line they must not cross.
//
// The funnel measures getting in; this measures staying, which is the number a
// beta cohort exists to produce. It is computed from two fields already on the
// subscriber record — createdAt and lastActiveOn — and it must stay aggregate:
// the dashboard is allowed to say "4 of 9 came back" and never which four.

const assert = require("node:assert/strict");
const { buildRetention } = require("../api/_shared/funnel");

const day = (n) => new Date(Date.UTC(2026, 8, n)).toISOString(); // Sept 2026
const dayOnly = (n) => day(n).slice(0, 10);
const now = new Date(Date.UTC(2026, 8, 30));

// Signing up and using it once is not "coming back". Counting the signup
// session as a return would report 100% retention for a product nobody
// reopened, which is the most flattering possible lie.
{
  const subs = [{ email: "a@x.edu", createdAt: day(1), lastActiveOn: dayOnly(1) }];
  const r = buildRetention(subs, now);
  assert.equal(r.totals.signups, 1);
  assert.equal(r.totals.everReturned, 0, "same-day activity must not count as a return");
}

// A day later is a return.
{
  const subs = [{ email: "a@x.edu", createdAt: day(1), lastActiveOn: dayOnly(2) }];
  assert.equal(buildRetention(subs, now).totals.everReturned, 1);
}

// Never active at all is never returned — not silently treated as active.
{
  const subs = [{ email: "a@x.edu", createdAt: day(1) }];
  const r = buildRetention(subs, now);
  assert.equal(r.totals.everReturned, 0);
  assert.equal(r.totals.activeLast7, 0);
}

// Week windows: 1-7 days is week 1; 21+ days is week 4.
{
  const subs = [
    { email: "a@x.edu", createdAt: day(1), lastActiveOn: dayOnly(5) },   // wk1
    { email: "b@x.edu", createdAt: day(1), lastActiveOn: dayOnly(25) },  // wk4
  ];
  const r = buildRetention(subs, now);
  const c = r.cohorts[0];
  assert.equal(c.signups, 2);
  assert.equal(c.week1, 1, "only the day-5 account is inside the week-1 window");
  assert.equal(c.week4, 1, "only the day-25 account is 21+ days out");
}

// "Active in the last 7 days" is measured against today, not against signup.
{
  const stale = [{ email: "a@x.edu", createdAt: day(1), lastActiveOn: dayOnly(2) }];
  assert.equal(buildRetention(stale, now).totals.activeLast7, 0, "28 days stale is not active");
  const fresh = [{ email: "a@x.edu", createdAt: day(1), lastActiveOn: dayOnly(28) }];
  assert.equal(buildRetention(fresh, now).totals.activeLast7, 1);
}

// Cohorts group by ISO week (Monday). 7 and 8 Sept 2026 are Mon and Tue of the
// same week; 6 Sept is the Sunday before and belongs to the previous one.
{
  const subs = [
    { email: "a@x.edu", createdAt: day(7) },
    { email: "b@x.edu", createdAt: day(8) },
    { email: "c@x.edu", createdAt: day(6) },
  ];
  const r = buildRetention(subs, now);
  assert.equal(r.cohorts.length, 2, "Sunday belongs to the previous week, not the Monday cohort");
  const monday = r.cohorts.find((c) => c.week === "2026-09-07");
  assert.equal(monday.signups, 2);
}

// Junk in, no crash out. A record with an unparseable date must not throw or
// silently become a phantom cohort.
{
  const subs = [
    { email: "a@x.edu", createdAt: "not a date", lastActiveOn: "also not a date" },
    { email: "b@x.edu" },
    null,
  ];
  const r = buildRetention(subs, now);
  assert.equal(r.totals.everReturned, 0);
}

// THE PRIVACY LINE. The output is counts. If an email address ever appears in
// this payload, the dashboard has become a per-person activity view and the
// promise in analytics.js ("no persistent identifiers", aggregate only) is no
// longer true.
{
  const subs = [
    { email: "student@trincoll.edu", createdAt: day(1), lastActiveOn: dayOnly(4) },
    { email: "other@trincoll.edu", createdAt: day(1), lastActiveOn: dayOnly(4) },
  ];
  const serialized = JSON.stringify(buildRetention(subs, now));
  assert.ok(!/@/.test(serialized), "retention output must contain no email addresses");
  assert.ok(!/trincoll/.test(serialized), "retention output must contain no identifying fragments");
}

console.log("Retention tests passed. Cohorts are aggregate, and a signup session is not a return.");

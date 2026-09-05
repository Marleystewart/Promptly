// Where does Promptly lose people?
//
// The dashboard could say how many accounts exist and what schools they came
// from, but not which step loses them — which is the only question that matters
// when traction is the bottleneck. "60 on the waitlist, 4 accounts" is a number
// with no diagnosis attached.
//
// Two things this deliberately does NOT do:
//
// 1. It does not blend page-view counts into the account funnel. Visits and
//    posting clicks are anonymous daily counters with a 9-day expiry, by
//    design — they cannot be attributed to an account and never should be.
//    Dividing "confirmed accounts" by "app opens" would produce a
//    confident-looking percentage out of two incompatible denominators. The
//    account stages below are exact record counts; activity is reported
//    separately and labelled as such.
//
// 2. It adds no new per-person tracking. Every field read here is already on
//    the subscriber record for an operational reason, so it is already covered
//    by account deletion.

const UNVERIFIED_PURGE_DAYS = 14;

function ageInDays(iso, now) {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? (now - t) / 86400000 : null;
}

// Can this account actually be sent a matching alert today?
//
// Confirmed is not enough on its own — with every notification switched off the
// digest never sends. But an empty field list does NOT block anything: see
// matchesOpening(), where `fields.length === 0` returns true for every opening.
// No fields means "match everything", not "match nothing".
//
// This function originally required at least one field and was wrong in the
// most misleading direction possible: the dashboard reported "0 can be alerted"
// on the same night the refresh cron queued 25 real digest items.
function isAlertReady(sub) {
  if (sub.verified !== true) return false;
  const emailOn = sub.emailNotifications !== false;
  const pushOn = sub.pushNotifications !== false && Boolean(sub.pushSubscription);
  return emailOn || pushOn;
}

function buildFunnel(subscribers = [], now = Date.now()) {
  const signedUp = subscribers.length;
  let confirmed = 0;
  let alertReady = 0;
  let everAlerted = 0;
  let unconfirmedExpiringSoon = 0;
  let confirmedNeverAlerted = 0;
  let noFields = 0;
  let alertsOff = 0;

  for (const sub of subscribers) {
    const isConfirmed = sub.verified === true;
    if (isConfirmed) confirmed += 1;

    if (!isConfirmed) {
      const age = ageInDays(sub.createdAt, now);
      // Deleted at day 14. Anything past day 11 is about to disappear, and is
      // still recoverable with a reminder today.
      if (age !== null && age >= UNVERIFIED_PURGE_DAYS - 3) unconfirmedExpiringSoon += 1;
      continue;
    }

    if (isAlertReady(sub)) alertReady += 1;
    else alertsOff += 1;

    // Tracked separately from the funnel, because it is not a blocked account —
    // it is an UNFILTERED one. With no fields every listing matches, so this
    // student gets the whole feed rather than their corner of it.
    const fields = Array.isArray(sub.fields) ? sub.fields.filter(Boolean) : [];
    if (!fields.length) noFields += 1;

    if (sub.firstAlertAt) everAlerted += 1;
    else confirmedNeverAlerted += 1;
  }

  const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

  return {
    // The funnel proper. Each stage is a subset of the one above it, so the
    // drop between two rows is a real number of people, not an estimate.
    stages: [
      { key: "signedUp", label: "Signed up", count: signedUp, of: signedUp, pct: signedUp ? 100 : 0 },
      { key: "confirmed", label: "Confirmed email", count: confirmed, of: signedUp, pct: pct(confirmed, signedUp) },
      { key: "alertReady", label: "Can be alerted", count: alertReady, of: signedUp, pct: pct(alertReady, signedUp) },
      { key: "everAlerted", label: "Has received an alert", count: everAlerted, of: signedUp, pct: pct(everAlerted, signedUp) },
    ],
    // Each of these is a specific group of people and a specific thing to do
    // about them, which a percentage alone never tells you.
    stuck: {
      unconfirmed: signedUp - confirmed,
      unconfirmedExpiringSoon,
      confirmedNeverAlerted,
      noFields,
      alertsOff,
    },
    purgeDays: UNVERIFIED_PURGE_DAYS,
  };
}

// Retention: do the people who signed up come back?
//
// The funnel above measures getting in. This measures staying, which is the
// only number that separates a product students use from one they tried. It is
// also the number a beta cohort exists to produce — sixty people who install
// and vanish teach nothing unless the vanishing is measured.
//
// Computed entirely from two fields already on the subscriber record:
// createdAt (when the account was made) and lastActiveOn (a date, overwritten
// daily). No event history is read or kept.
//
// Deliberately reported as counts, never as a list. The dashboard says "4 of 9
// from that week came back", never which four.
// Null rather than a throw on junk: a single unparseable createdAt on one
// record must not take down the whole dashboard, and a record we cannot place
// in time simply has no cohort.
function weekStart(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

function daysBetween(fromIso, toIso) {
  const a = Date.parse(fromIso);
  const b = Date.parse(toIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.floor((b - a) / 86400000);
}

// A student who lands an internship and stops opening Promptly is a SUCCESS,
// not churn. Nothing here can tell those apart yet, so the label says
// "returned", not "retained" — the honest claim is that they came back, and
// nothing is inferred about why anyone did not.
function buildRetention(subscribers, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const cohorts = new Map();

  for (const sub of subscribers || []) {
    if (!sub || !sub.createdAt) continue;
    const week = weekStart(sub.createdAt);
    if (!week) continue;
    if (!cohorts.has(week)) cohorts.set(week, { week, signups: 0, everReturned: 0, activeLast7: 0, week1: 0, week4: 0 });
    const row = cohorts.get(week);
    row.signups += 1;

    const active = sub.lastActiveOn;
    if (!active) continue;
    const sinceSignup = daysBetween(sub.createdAt, active);
    // Same-day activity is the signup session itself, not a return visit.
    if (sinceSignup !== null && sinceSignup >= 1) row.everReturned += 1;
    if (sinceSignup !== null && sinceSignup >= 1 && sinceSignup <= 7) row.week1 += 1;
    if (sinceSignup !== null && sinceSignup >= 21) row.week4 += 1;
    const staleness = daysBetween(active, today);
    if (staleness !== null && staleness <= 7) row.activeLast7 += 1;
  }

  const rows = [...cohorts.values()].sort((a, b) => (a.week < b.week ? 1 : -1)).slice(0, 12);
  const totals = rows.reduce((acc, r) => ({
    signups: acc.signups + r.signups,
    everReturned: acc.everReturned + r.everReturned,
    activeLast7: acc.activeLast7 + r.activeLast7,
  }), { signups: 0, everReturned: 0, activeLast7: 0 });

  return { cohorts: rows, totals };
}

module.exports = { buildFunnel, isAlertReady, UNVERIFIED_PURGE_DAYS, buildRetention };

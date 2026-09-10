// What "today" means on the dashboard.
//
// Every daily counter used `new Date().toISOString().slice(0, 10)`, which is a
// UTC day. Promptly's founders and very nearly all of its students are in the
// United States, so that day rolls over at 8pm Eastern (7pm outside daylight
// saving). The practical effect: at 9pm on the evening of a launch day the
// dashboard reported "Signups today: 0" beside "Accounts: 17", because the day
// those signups belonged to had already closed. The number was accurate and the
// word "today" was not.
//
// Reporting days are Eastern. Idempotency keys deliberately are NOT — see the
// comment in api/retention.js.

const REPORTING_TIME_ZONE = "America/New_York";

// en-CA formats as YYYY-MM-DD, which is the shape every existing key and
// comparison already expects, so switching zones does not change the format.
// Intl handles daylight saving, which hand-rolled offset arithmetic does not:
// a fixed -5 would be an hour wrong for two thirds of the year and would move
// the boundary twice a year without anyone noticing.
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORTING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// The reporting day a moment falls in, as YYYY-MM-DD.
function dayKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return formatter.format(d);
}

// N days before a moment, as a reporting day key. Steps by whole days from the
// instant rather than from the formatted string, so a DST transition shifts the
// boundary without dropping or duplicating a day.
function dayKeyAgo(days, from = new Date()) {
  const base = from instanceof Date ? from : new Date(from);
  if (Number.isNaN(base.getTime())) return null;
  return dayKey(new Date(base.getTime() - days * 86400000));
}

module.exports = { dayKey, dayKeyAgo, REPORTING_TIME_ZONE };

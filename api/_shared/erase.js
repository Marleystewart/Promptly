// Complete erasure of one person's data.
//
// deleteSubscriber() removed exactly two keys: the profile record and the
// membership set. Everything else keyed to that email survived — including a
// permanent token->email map with no TTL. The privacy policy tells students
// "we do not keep a shadow copy", and specifically that deletion removes
// "your watched companies", so that gap was a promise the code did not keep.
//
// Oddly, purgeUnverified() (for abandoned signups) was already more thorough
// than the path a user reaches by explicitly asking to be deleted. This makes
// the deliberate path the most complete one.
//
// Legacy exact-school progress rows could not be attributed back to one person,
// so the product no longer writes them and the daily retention job removes the
// old keys wholesale. This per-account path therefore has no such rows to find.

const { getRedis } = require("./store");
const { WATCHED_KEY, COVERAGE_KEY } = require("./watched-store");
const { REPORTS_KEY } = require("./reports");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Walk a hash of JSON records and rewrite only the entries that mention this
// address. Rewrites in place rather than deleting the row, because these rows
// are shared across users — a watched company may have other watchers.
async function scrubHash(redis, key, scrubber) {
  const raw = (await redis.hgetall(key)) || {};
  const updates = {};
  let removed = 0;

  for (const [field, value] of Object.entries(raw)) {
    let record = value;
    if (typeof record === "string") {
      try { record = JSON.parse(record); } catch { continue; }
    }
    if (!record || typeof record !== "object") continue;

    const next = scrubber(record);
    if (next === null) continue;
    updates[field] = JSON.stringify(next);
    removed += 1;
  }

  if (Object.keys(updates).length) await redis.hset(key, updates);
  return removed;
}

async function eraseSubscriber(email) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return { erased: false };

  // Read first: the unsubscribe token is only discoverable via the record, and
  // once the record is gone the token->email mapping is unreachable garbage
  // that still resolves to this person's address.
  let record = null;
  try { record = await redis.get(`promptly:subscriber:${normalized}`); } catch {}

  const removed = [];

  const jobs = [
    redis.del(`promptly:subscriber:${normalized}`),
    redis.srem("promptly:subscribers", normalized),
    redis.del(`promptly:digest:${normalized}`),
    redis.del(`promptly:verify-sent:${normalized}`),
  ];
  removed.push("profile", "subscriber-set", "queued-digest", "verify-cooldown");

  if (record && record.unsubToken) {
    jobs.push(redis.del(`promptly:unsub:${record.unsubToken}`));
    removed.push("unsubscribe-token");
  }

  // The confirmation token maps token -> EMAIL ADDRESS and is only reachable
  // from the token side, so once the profile is deleted it becomes unreachable
  // garbage that still resolves to this person. It carries a one-week TTL, so
  // the address outlived an explicit deletion request by up to seven days.
  // Exactly the gap this file was written to close for the unsubscribe token.
  if (record && record.verifyToken) {
    jobs.push(redis.del(`promptly:verify:${record.verifyToken}`));
    removed.push("verify-token");
  }

  await Promise.all(jobs);

  // Watched companies: the policy explicitly promises these are removed.
  let watchedScrubbed = 0;
  try {
    watchedScrubbed = await scrubHash(redis, WATCHED_KEY, (r) => {
      const watchers = Array.isArray(r.watchers) ? r.watchers : [];
      if (!watchers.includes(normalized)) return null;
      return { ...r, watchers: watchers.filter((w) => w !== normalized) };
    });
  } catch {}
  if (watchedScrubbed) removed.push(`watched-sources(${watchedScrubbed})`);

  // Coverage requests: demand signal we want to keep, but the requester's
  // address is not needed to keep the count.
  let coverageScrubbed = 0;
  try {
    coverageScrubbed = await scrubHash(redis, COVERAGE_KEY, (r) => {
      const by = Array.isArray(r.requestedBy) ? r.requestedBy : [];
      if (!by.includes(normalized)) return null;
      return { ...r, requestedBy: by.filter((e) => e !== normalized) };
    });
  } catch {}
  if (coverageScrubbed) removed.push(`coverage-requests(${coverageScrubbed})`);

  // Listing reports: the report itself is operational (a broken link is still
  // broken after the reporter leaves), so keep the report and drop only the
  // contact address, which exists solely for optional follow-up.
  let reportsScrubbed = 0;
  try {
    reportsScrubbed = await scrubHash(redis, REPORTS_KEY, (r) => {
      if (normalizeEmail(r.lastReporterEmail) !== normalized) return null;
      return { ...r, lastReporterEmail: null };
    });
  } catch {}
  if (reportsScrubbed) removed.push(`listing-reports(${reportsScrubbed})`);

  return { erased: true, removed };
}

// Remove fields the alert store keeps but nothing reads.
//
// The client stopped sending `major` and `interests` to Upstash, but stopping
// new writes does not clear what is already there — an account only loses them
// on its next save, and a dormant account never saves again. matchesOpening()
// never read either field and no dashboard counts them, so every stored copy is
// retention with no purpose. Runs from the daily retention job.
//
// Deliberately in-place rather than deleting rows: these are live subscribers,
// and the rest of the record is doing real work.
// gradYear is here because the exact year is now replaced by gradYearBand:
// stored copies still hold the precise year until this scrubs them.
const MINIMIZE_FIELDS = ["major", "interests", "gradYear"];

async function minimizeSubscriberProfiles(redis, emails) {
  if (!redis || !Array.isArray(emails)) return { scrubbed: 0 };
  let scrubbed = 0;
  for (const email of emails) {
    const key = `promptly:subscriber:${normalizeEmail(email)}`;
    try {
      const record = await redis.get(key);
      if (!record) continue;
      const present = MINIMIZE_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(record, f));
      if (!present.length) continue;
      const next = { ...record };
      for (const field of present) delete next[field];
      await redis.set(key, next);
      scrubbed += 1;
    } catch {}
  }
  return { scrubbed };
}

module.exports = { eraseSubscriber, scrubHash, minimizeSubscriberProfiles, MINIMIZE_FIELDS };

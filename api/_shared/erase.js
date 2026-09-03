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
const { deleteVerificationTokensForEmail } = require("./verification-store");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

const DELETE_HASH_FIELD = Symbol("delete-hash-field");

// Walk a hash of JSON records and change only the entries that mention this
// address. Shared rows are rewritten; a caller can return DELETE_HASH_FIELD
// when the whole row belongs only to the departing user.
async function scrubHash(redis, key, scrubber) {
  const raw = (await redis.hgetall(key)) || {};
  const updates = {};
  const deletions = [];
  let removed = 0;

  for (const [field, value] of Object.entries(raw)) {
    let record = value;
    if (typeof record === "string") {
      try { record = JSON.parse(record); } catch { continue; }
    }
    if (!record || typeof record !== "object") continue;

    const next = scrubber(record);
    if (next === null) continue;
    if (next === DELETE_HASH_FIELD) deletions.push(field);
    else updates[field] = JSON.stringify(next);
    removed += 1;
  }

  if (Object.keys(updates).length) await redis.hset(key, updates);
  if (deletions.length) await redis.hdel(key, ...deletions);
  return removed;
}

async function eraseSubscriber(email) {
  const redis = await getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) return { erased: false };

  // Read first: the unsubscribe token is only discoverable via the record, and
  // once the record is gone the token->email mapping is unreachable garbage
  // that still resolves to this person's address.
  const record = await redis.get(`promptly:subscriber:${normalized}`);

  const removed = [];

  // Remove token mappings while the profile still makes every token
  // discoverable. If any later shared-store cleanup fails, the profile remains
  // in place so the authenticated caller can retry instead of being stranded.
  await deleteVerificationTokensForEmail(redis, normalized);
  removed.push("verification-tokens");
  if (record && record.unsubToken) {
    await redis.del(`promptly:unsub:${record.unsubToken}`);
    removed.push("unsubscribe-token");
  }

  // Watched companies: the policy explicitly promises these are removed.
  const watchedScrubbed = await scrubHash(redis, WATCHED_KEY, (r) => {
    const watchers = Array.isArray(r.watchers) ? r.watchers : [];
    if (!watchers.includes(normalized)) return null;
    const remaining = watchers.filter((w) => w !== normalized);
    // A source requested only by this departing user is personal preference
    // data, not a global registry entry. Stop fetching it when nobody remains.
    return remaining.length ? { ...r, watchers: remaining } : DELETE_HASH_FIELD;
  });
  if (watchedScrubbed) removed.push(`watched-sources(${watchedScrubbed})`);

  // Coverage requests: demand signal we want to keep, but the requester's
  // address is not needed to keep the count.
  const coverageScrubbed = await scrubHash(redis, COVERAGE_KEY, (r) => {
    const by = Array.isArray(r.requestedBy) ? r.requestedBy : [];
    if (!by.includes(normalized)) return null;
    return { ...r, requestedBy: by.filter((e) => e !== normalized) };
  });
  if (coverageScrubbed) removed.push(`coverage-requests(${coverageScrubbed})`);

  // Listing reports: the report itself is operational (a broken link is still
  // broken after the reporter leaves), so keep the report and drop only the
  // contact address, which exists solely for optional follow-up.
  const reportsScrubbed = await scrubHash(redis, REPORTS_KEY, (r) => {
    if (normalizeEmail(r.lastReporterEmail) !== normalized) return null;
    return { ...r, lastReporterEmail: null };
  });
  if (reportsScrubbed) removed.push(`listing-reports(${reportsScrubbed})`);

  // Destructive direct-key cleanup comes last. Once this succeeds no current
  // personal-data edge remains, and it is safe for the route to delete auth.
  await Promise.all([
    redis.del(`promptly:subscriber:${normalized}`),
    redis.srem("promptly:subscribers", normalized),
    redis.del(`promptly:digest:${normalized}`),
    redis.del(`promptly:verify-sent:${normalized}`),
  ]);
  removed.push("profile", "subscriber-set", "queued-digest", "verify-cooldown");

  return { erased: true, removed };
}

module.exports = { eraseSubscriber, scrubHash };

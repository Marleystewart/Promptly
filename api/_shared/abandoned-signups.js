// Delete Supabase accounts that were created and never confirmed.
//
// Promptly tells a student, in the banner they see on every screen, that
// "Unconfirmed profiles are deleted after 14 days." Until now that could not
// happen for the case it describes.
//
// purgeUnverified() walks the Upstash subscriber records — but /api/subscribe
// requires a CONFIRMED email, so someone who signs up and never clicks the link
// never gets an Upstash record at all. There was nothing for the purge to find,
// and their Supabase account (email address, and whatever name they gave)
// stayed indefinitely. The promise was real; the mechanism only covered
// accounts that had already been confirmed at some point.
//
// This sweep closes it from the Supabase side, which is the only place those
// accounts exist.
//
// It deletes real user accounts, so every guard here is deliberate:
//
//   * only accounts with NO email_confirmed_at
//   * only accounts older than the stated 14 days
//   * never an account that has a confirmed Upstash subscriber, even if
//     Supabase somehow disagrees — defence in depth against deleting a working
//     account because of a field mismatch
//   * capped per run, so a bug cannot empty the project in one night
//   * counts reported, so the number is visible rather than assumed

const UNCONFIRMED_DAYS = 14;
const MAX_DELETES_PER_RUN = 50;
const PAGE_SIZE = 200;

function serviceCredentials() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";
  return { url, secret };
}

function ageDays(iso, now) {
  const t = Date.parse(iso || "");
  return Number.isFinite(t) ? (now - t) / 86400000 : null;
}

// Supabase has returned both a bare array and { users: [...] } across versions.
function usersFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.users)) return payload.users;
  return [];
}

function isAbandoned(user, now) {
  if (!user || !user.id || !user.email) return false;
  // Any confirmation signal at all disqualifies it.
  if (user.email_confirmed_at || user.confirmed_at || user.last_sign_in_at) return false;
  const age = ageDays(user.created_at, now);
  return age !== null && age >= UNCONFIRMED_DAYS;
}

async function sweepAbandonedSignups({
  now = Date.now(),
  getSubscriber = null,
  dryRun = false,
} = {}) {
  const { url, secret } = serviceCredentials();
  if (!url || !secret) return { swept: 0, deleted: 0, skipped: 0, stored: false };

  const headers = { Authorization: `Bearer ${secret}`, apikey: secret };
  const candidates = [];
  let scanned = 0;

  for (let page = 1; page <= 20; page += 1) {
    let payload;
    try {
      const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=${PAGE_SIZE}`, {
        headers,
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) break;
      payload = await res.json();
    } catch {
      break;
    }
    const users = usersFrom(payload);
    scanned += users.length;
    for (const user of users) {
      if (isAbandoned(user, now)) candidates.push(user);
    }
    if (users.length < PAGE_SIZE) break;
  }

  let deleted = 0;
  let skipped = 0;

  for (const user of candidates.slice(0, MAX_DELETES_PER_RUN)) {
    // Last check before an irreversible delete: if Promptly holds a CONFIRMED
    // subscriber for this address, the two systems disagree and we keep the
    // account. Losing an abandoned row is cheap; deleting a working account is
    // not, so the tie goes to keeping it.
    if (getSubscriber) {
      try {
        const record = await getSubscriber(user.email);
        if (record && record.verified === true) { skipped += 1; continue; }
      } catch {
        skipped += 1; // could not check — do not delete on a failed check
        continue;
      }
    }

    if (dryRun) { deleted += 1; continue; }

    try {
      const res = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
        headers,
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) deleted += 1;
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }

  return {
    stored: true,
    scanned,
    swept: candidates.length,
    deleted,
    skipped,
    capped: candidates.length > MAX_DELETES_PER_RUN,
  };
}

module.exports = {
  sweepAbandonedSignups,
  isAbandoned,
  usersFrom,
  UNCONFIRMED_DAYS,
  MAX_DELETES_PER_RUN,
};

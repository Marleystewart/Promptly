// Every Promptly account, read from Supabase Auth — the source of truth.
//
// The founder dashboard used to count Upstash subscriber records. Those only
// exist once a student has CONFIRMED their email and their profile synced, so
// the dashboard said 27 while Supabase held 49 accounts: everyone who signed
// up but hadn't confirmed yet, or never finished setup, was invisible. This
// lists the accounts themselves and joins the profile on where one exists.

const PAGE_SIZE = 200;
const MAX_PAGES = 50;

function credentials() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "",
  };
}

function usersFrom(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.users)) return payload.users;
  return [];
}

async function listAuthAccounts({ fetchImpl = fetch } = {}) {
  const { url, secret } = credentials();
  if (!url || !secret) return { available: false, users: [] };
  const headers = { Authorization: `Bearer ${secret}`, apikey: secret };
  const users = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await fetchImpl(`${url}/auth/v1/admin/users?page=${page}&per_page=${PAGE_SIZE}`, {
      headers,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { available: false, users: [], error: `Supabase returned ${res.status}` };
    const batch = usersFrom(await res.json());
    users.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return { available: true, users };
}

// One row per account, newest first, with the Promptly profile where it exists.
// Profiles with no matching account (legacy local-only records) are kept too,
// flagged, so nothing silently disappears from the list.
function mergeAccounts(users, subscribers, { pushState = () => "off" } = {}) {
  const profiles = new Map(subscribers.filter((s) => s && s.email).map((s) => [String(s.email).trim().toLowerCase(), s]));
  const seen = new Set();
  const rows = [];
  for (const user of users) {
    const email = String(user.email || "").trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    const s = profiles.get(email);
    rows.push({
      email,
      joined: user.created_at || null,
      confirmed: Boolean(user.email_confirmed_at || user.confirmed_at),
      lastSignIn: user.last_sign_in_at || null,
      provider: (user.app_metadata && user.app_metadata.provider) || "email",
      hasProfile: Boolean(s),
      school: (s && s.school) || "—",
      gradYear: (s && s.gradYearBand) || "—",
      push: s ? pushState(s) : "off",
      email_on: s ? s.emailNotifications !== false : false,
      reachable: s ? s.emailNotifications !== false && s.verified === true : false,
      lastActiveOn: (s && s.lastActiveOn) || null,
      noAccount: false,
    });
  }
  for (const [email, s] of profiles) {
    if (seen.has(email)) continue;
    rows.push({
      email,
      joined: s.createdAt || s.updatedAt || null,
      confirmed: s.verified === true,
      lastSignIn: null,
      provider: "—",
      hasProfile: true,
      school: s.school || "—",
      gradYear: s.gradYearBand || "—",
      push: pushState(s),
      email_on: s.emailNotifications !== false,
      reachable: s.emailNotifications !== false && s.verified === true,
      lastActiveOn: s.lastActiveOn || null,
      noAccount: true,
    });
  }
  rows.sort((a, b) => Date.parse(b.joined || 0) - Date.parse(a.joined || 0));
  const summary = {
    total: users.length ? rows.filter((r) => !r.noAccount).length : subscribers.length,
    confirmed: rows.filter((r) => !r.noAccount && r.confirmed).length,
    unconfirmed: rows.filter((r) => !r.noAccount && !r.confirmed).length,
    withProfile: rows.filter((r) => !r.noAccount && r.hasProfile).length,
    withoutProfile: rows.filter((r) => !r.noAccount && !r.hasProfile).length,
    profilesWithoutAccount: rows.filter((r) => r.noAccount).length,
  };
  return { rows, summary };
}

module.exports = { listAuthAccounts, mergeAccounts, usersFrom };

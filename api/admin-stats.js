// Private founder dashboard data: how many accounts, from what schools, grad
// years, fields, plus live activity. Secret-gated (never public — it contains
// user info). Set ADMIN_SECRET (or reuse CRON_SECRET) in Vercel, then open
// /admin.html and paste the secret.

const { listSubscribers, takeAdminAttempt, getRedis, countPresent } = require("./_shared/store");
const { getStats, getViewBreakdown } = require("./_shared/analytics");
const { listWatchedSources, listCoverageRequests } = require("./_shared/watched-store");
const { listSourceHealth } = require("./_shared/source-health");
const { listReports } = require("./_shared/reports");
const { readEmailHealth } = require("./_shared/email-health");
const { readIntegrationHealth, probeUsaJobs } = require("./_shared/integration-health");
const { readRunHealth, readPrivacyCleanup } = require("./_shared/run-health");
const { buildFunnel, buildRetention, isAlertReady } = require("./_shared/funnel");
const crypto = require("crypto");
const { dayKey, dayKeyAgo } = require("./_shared/day");

// Accounts that can actually be sent an alert today, reused for the headline.
function funnelReadyCount(subscribers) {
  return (subscribers || []).filter((s) => isAlertReady(s)).length;
}

function mask(email) {
  if (!email) return "—";
  const [u, d] = String(email).split("@");
  return (u ? u[0] + "***" : "") + "@" + (d || "");
}

// Hash both sides first so the comparison is constant-length: comparing raw
// buffers meant a wrong-length guess returned early, leaking the secret's size.
function secretsMatch(provided, expected) {
  const left = crypto.createHash("sha256").update(String(provided || "")).digest();
  const right = crypto.createHash("sha256").update(String(expected || "")).digest();
  return crypto.timingSafeEqual(left, right);
}

// ADMIN_PIN is a separate, weaker credential: short and numeric on purpose,
// for a fast unlock on health.html's phone-style keypad. It must NEVER gate
// admin.html, which returns real user emails — only ADMIN_SECRET does that.
// A short PIN is brute-forceable in principle; the per-requester throttle
// below is what actually holds that off, not the PIN's length.
function pinMatches(provided) {
  const pin = String(process.env.ADMIN_PIN || "").trim();
  if (!pin || !/^\d{4,8}$/.test(pin)) return false; // unset or misconfigured = no PIN path
  return secretsMatch(provided, pin);
}

// What a single account's push actually is, as one of three states.
//
// The toggle and the address are separate facts and both have to hold. An
// account can have pushNotifications on with nothing registered (asked for it,
// never granted permission) or an address left over from before the toggle went
// off — resolvePushSubscription clears that on the next save, but not before.
// Reporting either as "on" would overstate reach.
function pushState(s) {
  if (!s || s.pushNotifications === false) return "off";
  if (s.deviceToken) return "app";
  if (s.pushSubscription) return "web";
  return "off";
}

module.exports = async function handler(req, res) {
  const secret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
  const authorization = String(req.headers.authorization || "");
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!secret) return res.status(401).json({ error: "Set ADMIN_SECRET in Vercel to use this." });
  const viaPin = pinMatches(provided);

  // Throttle guessing. Without this the shared secret is brute-forceable at
  // request rate, since there is no account lockout to fall back on.
  const requester = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown")
    .split(",")[0].trim().slice(0, 64);
  const attempt = await takeAdminAttempt(requester);
  if (!attempt.allowed) {
    return res.status(429).json({ error: "Too many attempts. Wait a minute and try again." });
  }

  if (!secretsMatch(provided, secret) && !viaPin) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { subscribers = [], setupRequired } = await listSubscribers();

    const bySchool = {}, byGradYear = {}, byField = {};
    let withEmail = 0, withPush = 0, withEduEmail = 0;
    for (const s of subscribers) {
      const school = (s.school || "").trim() || "Unknown";
      bySchool[school] = (bySchool[school] || 0) + 1;
      // A band, not the exact year — see gradYearBand() in script.js.
      const gy = (s.gradYearBand || "").trim() || "Unknown";
      byGradYear[gy] = (byGradYear[gy] || 0) + 1;
      (Array.isArray(s.fields) ? s.fields : []).forEach((f) => { byField[f] = (byField[f] || 0) + 1; });
      if (s.email) withEmail += 1;
      // Either transport counts. A student who installed the iOS app has a
      // device token and no web endpoint; counting only the endpoint reported
      // them as having push switched off, which is the opposite of the truth.
      if (pushState(s) !== "off") withPush += 1;
      // How many accounts are institutionally confirmed. Real signal for
      // school conversations — and a check that .edu detection is working.
      if (s.studentVerified === true) withEduEmail += 1;
    }
    const sortDesc = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);

    // The numbers worth seeing before anything else.
    //
    // "Active" comes from lastActiveOn, a date written once per day when a
    // signed-in student opens the app. That is genuinely the finest resolution
    // there is: nothing tracks presence by the minute, so this cannot say who
    // is on the app RIGHT NOW and does not pretend to. Today and the last seven
    // days are the honest questions it can answer.
    var todayStr = dayKey();
    var sevenDaysAgo = dayKeyAgo(7);
    var activeToday = 0, activeLast7 = 0;
    for (const s of subscribers) {
      const on = s.lastActiveOn;
      if (!on) continue;
      if (on === todayStr) activeToday += 1;
      if (on >= sevenDaysAgo) activeLast7 += 1;
    }

    // Schools, excluding the "Unknown" bucket — an account that never told us
    // where it studies is not a school we have reached.
    const schoolCount = Object.keys(bySchool).filter((k) => k !== "Unknown").length;

    // Which cohort actually signs up. Bands, not exact years, and "Unknown" is
    // never reported as the winner: it is an absence of data, not a year group.
    const gradRanked = sortDesc(byGradYear).filter(([k]) => k !== "Unknown");
    const topGradYear = gradRanked.length ? { band: gradRanked[0][0], count: gradRanked[0][1] } : null;

    // Which campus is actually carrying this. Same rules as the year band:
    // "Unknown" is an absence of data, never the winner, and a tie is reported
    // as a tie rather than silently picking whichever name sorted first — with
    // 17 accounts a one-account lead is noise, and calling it a winner would
    // send someone to the wrong campus.
    const schoolRanked = sortDesc(bySchool).filter(([name]) => name !== "Unknown");
    const topSchool = schoolRanked.length
      ? {
          name: schoolRanked[0][0],
          count: schoolRanked[0][1],
          tiedWith: schoolRanked.filter(([, n]) => n === schoolRanked[0][1]).length - 1,
        }
      : null;

    // Live right now. Counted from keys that expire in two minutes, so this is
    // genuinely "in the last couple of minutes" rather than a guess.
    let liveNow = 0;
    try { liveNow = await countPresent(); } catch {}

    const headline = {
      liveNow: liveNow,
      signups: subscribers.length,
      activeToday: activeToday,
      activeLast7: activeLast7,
      confirmed: funnelReadyCount(subscribers),
      schools: schoolCount,
      topGradYear: topGradYear,
      topSchool: topSchool,
      everReturnedPct: null, // filled in below, once retention is built
    };

    const recent = [...subscribers]
      .sort((a, b) => Date.parse(b.updatedAt || b.createdAt || 0) - Date.parse(a.updatedAt || a.createdAt || 0))
      .slice(0, 20)
      // Per-account row: the most identifying view on the page, so it shows the
      // band rather than the exact year.
      // Full address, not masked. This page is behind ADMIN_SECRET and shows
      // the founders their own users; a masked address cannot be used to answer
      // "this student says alerts stopped, what does their record look like".
      // A PIN holder never reaches this branch — see the viaPin guard below.
      .map((s) => ({
        email: s.email || "—", school: s.school || "—", gradYear: s.gradYearBand || "—",
        when: s.updatedAt || s.createdAt || null, lastActiveOn: s.lastActiveOn || null,
        // Who actually hears from us, per account. The aggregate counters above
        // answer "how many"; this answers "which ones", which is the question
        // you have when a student says they never got an alert.
        push: pushState(s),
        // A digest is never even queued for an unverified record, so email
        // being on is not the same as email being reachable.
        email_on: s.emailNotifications !== false,
        reachable: s.emailNotifications !== false && s.verified === true,
      }));

    const live = await getStats();

    // Where people drop. Exact record counts, never blended with the anonymous
    // daily activity counters below — see funnel.js for why that matters.
    const funnel = buildFunnel(subscribers, Date.now());
    // Retention reads only createdAt and lastActiveOn, both already on the
    // subscriber record and both erased with the account. Aggregate rows only.
    const retention = buildRetention(subscribers, new Date());
    headline.everReturnedPct = retention.totals.signups
      ? Math.round((retention.totals.everReturned / retention.totals.signups) * 100)
      : 0;
    let viewUsage = [];
    try { viewUsage = await getViewBreakdown(7); } catch {}

    // "Watch any company" intent data — what users asked Promptly to track.
    // Watched = a real ATS board now in the pipeline; coverage = a page we
    // couldn't auto-read (a demand signal for sources worth adding).
    let watched = [], coverage = [];
    try { watched = await listWatchedSources(); } catch {}
    try { coverage = await listCoverageRequests(); } catch {}
    const watchedRows = watched
      .sort((a, b) => (b.watchers || []).length - (a.watchers || []).length)
      .slice(0, 50)
      .map((w) => ({ company: w.company || "—", ats: w.ats || "—", watchers: (w.watchers || []).length }));
    const coverageRows = coverage
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 50)
      .map((c) => ({ url: c.url || "—", company: c.company || "—", requests: c.count || (c.requestedBy || []).length || 1 }));

    // Corroborating content check, not authoritative — a listing here was
    // flagged by weak dead-language text matching, never removed by it. See
    // api/verify-listings.js for why no single link signal is trusted alone.
    let verify = null;
    try {
      const redis = await getRedis();
      verify = redis ? await redis.get("promptly:verify:last-run") : null;
    } catch {}

    // Per-source health. Custom scrapers break silently when an employer
    // redesigns their page, so surface every source's state and sort the
    // broken ones to the top.
    let sourceHealth = [];
    try { sourceHealth = await listSourceHealth(); } catch {}
    const RANK = { broken: 0, quiet: 1, ok: 2 };
    sourceHealth.sort((a, b) =>
      (RANK[a.state] - RANK[b.state]) || String(a.company).localeCompare(String(b.company)));

    const sourceHealthCounts = sourceHealth.reduce((acc, s) => {
      acc[s.state] = (acc[s.state] || 0) + 1;
      return acc;
    }, {});

    // A PIN-holder gets health.html's data only — never subscriber records,
    // even masked ones. Only ADMIN_SECRET unlocks the full founder dashboard.
    if (viaPin && !secretsMatch(provided, secret)) {
      return res.status(200).json({ sourceHealth, sourceHealthCounts });
    }

    // Student-reported listing problems. Corroborating signal for manual
    // review — nothing here was removed automatically.
    let reports = [];
    try { reports = await listReports(); } catch {}

    // Can email actually reach a student right now? Resend accepts the sandbox
    // sender but only delivers it to the account owner, so "no errors" never
    // meant "working". Surfaced explicitly rather than inferred from silence.
    let emailHealth = null;
    try { emailHealth = await readEmailHealth(); } catch {}

    // Optional adapters that silently no-op without credentials. USAJOBS is
    // the whole of federal coverage and returns [] when unset, so surface it.
    let integrationHealth = null;
    try { integrationHealth = readIntegrationHealth(); } catch {}
    // Actually call USAJOBS rather than trusting that the variables exist — a
    // present-but-wrong key is invisible from inside the process.
    try { integrationHealth.usajobsProbe = await probeUsaJobs(); } catch {}

    // Did the two scheduled jobs actually run, and what did they do? Without
    // this, a cron failing every night is indistinguishable from a quiet week.
    let runHealth = null;
    try { runHealth = await readRunHealth(); } catch {}

    // Privacy housekeeping, so "confirm cleanup metrics" is something a person
    // can actually do. These should read zero; a non-zero count means something
    // is still writing data we have decided not to keep.
    let privacyCleanup = null;
    try { privacyCleanup = await readPrivacyCleanup(); } catch {}

    return res.status(200).json({
      headline,
      funnel,
      retention,
      viewUsage,
      privacyCleanup,
      runHealth,
      emailHealth,
      integrationHealth,
      sourceHealth,
      sourceHealthCounts,
      reports: reports.slice(0, 50),
      reportCount: reports.length,
      watchedCount: watched.length,
      coverageCount: coverage.length,
      watched: watchedRows,
      coverage: coverageRows,
      verify,
      totalAccounts: subscribers.length,
      withEmail,
      withEduEmail,
      withPush,
      // Split by transport, so "we shipped an iOS app" has a number attached to
      // it rather than a feeling.
      pushWeb: subscribers.filter((s) => pushState(s) === "web").length,
      pushApp: subscribers.filter((s) => pushState(s) === "app").length,
      pushOff: subscribers.filter((s) => pushState(s) === "off").length,
      // Accounts an email alert can actually reach today: switched on AND
      // verified. The gap between this and withEmail is the reachable-but-not
      // -reached group, which is the number worth acting on.
      emailReachable: subscribers.filter((s) => s.emailNotifications !== false && s.verified === true).length,
      bySchool: sortDesc(bySchool),
      byGradYear: sortDesc(byGradYear),
      byField: sortDesc(byField),
      live,
      recent,
      setupRequired,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to load stats." });
  }
};

module.exports.pinMatches = pinMatches;

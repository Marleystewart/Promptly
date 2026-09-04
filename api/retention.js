const { forEachSubscriberBatch, claimOnce, releaseClaim, getRedis } = require("./_shared/store");
const { runLinkVerification } = require("./_shared/link-verify");
const { listReports, pruneReports } = require("./_shared/reports");
const { minimizeCoverageContacts } = require("./_shared/watched-store");
const { purgeLegacyOutcomeData } = require("./_shared/analytics");
const { getLiveOpenings, takeDigestItems, queueDigestItems } = require("./_shared/openings-store");
const { sendDailyDigest, sendWeeklyRecap, sendDeadlineReminder, sendDeadlinePush, matchesOpening } = require("./_shared/alerts");
const { getOrCreateUnsubToken, createVerifyToken, purgeUnverified } = require("./_shared/tokens");
const { markFirstAlert, getSubscriber } = require("./_shared/store");
const { sendVerificationReminder } = require("./_shared/alerts");
const { recordRun, recordPrivacyCleanup } = require("./_shared/run-health");
const { minimizeSubscriberProfiles } = require("./_shared/erase");
const { sweepAbandonedSignups } = require("./_shared/abandoned-signups");
const { sendHeartbeat } = require("./_shared/heartbeat");

// An unconfirmed profile is data we were never given permission to keep.
// Remind on days 3 and 10, delete on day 14.
const UNVERIFIED_REMINDER_DAYS = [3, 10];
const UNVERIFIED_PURGE_DAYS = 14;

// Whole days elapsed since an ISO timestamp, or null if it is unusable.
function daysSince(iso, now = new Date()) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return null;
  return Math.floor((now.getTime() - then) / 86400000);
}

function daysUntil(deadline, now = new Date()) {
  const target = Date.parse(deadline);
  if (!Number.isFinite(target)) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const due = new Date(target);
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((dueDay - today) / 86400000);
}

function weekKey(now) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const day = Math.floor((now - start) / 86400000);
  return `${now.getUTCFullYear()}-${Math.ceil((day + start.getUTCDay() + 1) / 7)}`;
}

function recapOpenings(live, subscriber) {
  const matched = live.filter((opening) => matchesOpening(opening, subscriber));
  const combined = [...matched, ...(subscriber.savedAlerts || [])];
  const seen = new Set();
  return combined.filter((opening) => {
    const key = opening.sourceUrl || `${opening.company}|${opening.role}`;
    if (!opening.company || !opening.role || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

module.exports = async function handler(req, res) {
  // Fail CLOSED. This endpoint mails every subscriber, so an unset secret must
  // never mean "open to anyone" — previously it skipped the check altogether.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "Retention is not configured. Set CRON_SECRET in the deployment environment." });
  }
  const isVercelCron = req.headers.authorization === `Bearer ${secret}`;
  const provided = (req.query && req.query.secret) || "";
  if (!isVercelCron && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const forceWeekly = req.query && req.query.mode === "weekly";
    const shouldSendWeekly = forceWeekly || now.getUTCDay() === 1;
    const livePayload = await getLiveOpenings();
    const live = livePayload.openings || [];
    const stats = { subscribers: 0, digestsSent: 0, weeklySent: 0, reminderEmails: 0, reminderPushes: 0, verifyReminders: 0, unverifiedPurged: 0 };

    // Privacy housekeeping runs with the existing daily retention job: remove
    // expired reports and contact fields older builds collected unnecessarily,
    // and delete legacy exact-school progress rows no current feature uses.
    const privacyCleanup = {};
    try { privacyCleanup.reports = await pruneReports(now); } catch {}
    try { privacyCleanup.coverage = await minimizeCoverageContacts(); } catch {}
    try { privacyCleanup.legacyOutcomes = await purgeLegacyOutcomeData(); } catch {}
    // Fields the alert store keeps but nothing reads. Stopping new writes does
    // not clear existing records, and a dormant account never saves again.
    try {
      const redis = await getRedis();
      const emails = redis ? await redis.smembers("promptly:subscribers") : [];
      privacyCleanup.minimizedProfiles = await minimizeSubscriberProfiles(redis, emails);
    } catch {}
    // Persisted, not just returned: the audit's remaining action on the legacy
    // school keys is literally "confirm cleanup metrics", and a number that
    // only exists in a cron's HTTP response cannot be confirmed by anyone.
    // Supabase accounts that were created and never confirmed. purgeUnverified
    // cannot reach these: /api/subscribe requires a confirmed email, so an
    // abandoned signup never gets an Upstash record for it to find. The banner
    // promises deletion after 14 days, and this is the only place it can happen.
    try {
      privacyCleanup.abandonedSignups = await sweepAbandonedSignups({ getSubscriber });
    } catch {}
    try { await recordPrivacyCleanup(privacyCleanup); } catch {}

    // Content-check a slice of live sourceUrls. Independent of the subscriber
    // loop below (listings, not people) and never lets a verification failure
    // block the actual mail this cron exists to send.
    //
    // Student reports are passed in so reported listings jump the queue: the
    // rotating window alone would leave a reported link waiting ~10 days for
    // its turn, by which point the report is useless.
    let openReports = [];
    try { openReports = await listReports(); } catch {}
    const linkCheck = await runLinkVerification({ getRedis, openings: live, reports: openReports });

    // Batched rather than loading every subscriber at once — this job mails the
    // whole list, so at scale the old fan-out would run out of memory before
    // sending a single digest.
    await forEachSubscriberBatch(async (batch) => {
    stats.subscribers += batch.length;
    for (const subscriber of batch) {
      // ── Unconfirmed profile lifecycle ───────────────────────────────────
      // A record nobody confirmed is data we were never given permission to
      // hold. Remind twice, then delete it. Confirmed accounts are never
      // touched by this.
      if (subscriber.verified !== true && subscriber.email) {
        const ageDays = daysSince(subscriber.createdAt, now);
        if (ageDays !== null && ageDays >= UNVERIFIED_PURGE_DAYS) {
          try {
            await purgeUnverified(subscriber.email);
            stats.unverifiedPurged += 1;
          } catch {}
          continue; // gone — nothing else to do for this record
        }
        const dueReminder = UNVERIFIED_REMINDER_DAYS.find((d) => ageDays === d);
        if (dueReminder) {
          const key = `verify-reminder:${subscriber.email}:${dueReminder}`;
          if (await claimOnce(key, 30 * 86400)) {
            try {
              const token = await createVerifyToken(subscriber.email, { force: true });
              if (token) {
                const left = UNVERIFIED_PURGE_DAYS - dueReminder;
                if ((await sendVerificationReminder(subscriber, token, left)).sent) {
                  stats.verifyReminders += 1;
                }
              }
            } catch {}
          }
        }
        continue; // unconfirmed records get no alerts of any kind
      }

      // Email only ever goes to a confirmed address. Push is exempt: a push
      // subscription is minted by the user's own browser, so it already proves
      // the person consented on that device.
      const emailAllowed = subscriber.verified === true;
      const unsubToken = emailAllowed ? await getOrCreateUnsubToken(subscriber.email) : null;
      // Daily digest: flush this subscriber's queued matches (filled by the
      // hourly refresh) as one email. Claim key stops double-sends if the
      // cron ever runs twice; on failure the items are re-queued.
      if (emailAllowed && subscriber.emailNotifications !== false && subscriber.email) {
        const queued = await takeDigestItems(subscriber.email);
        if (queued.length) {
          const dayKey = now.toISOString().slice(0, 10);
          const deliveryKey = `digest:${subscriber.email}:${dayKey}`;
          const claimed = await claimOnce(deliveryKey, 2 * 86400);
          if (claimed) {
            let delivered = false;
            try {
              delivered = Boolean((await sendDailyDigest(queued, subscriber, unsubToken)).sent);
              if (delivered) {
                stats.digestsSent += 1;
                // Stamp the first alert this account has ever actually
                // received. "Confirmed" and "has been sent something" are
                // different states, and the gap between them is the one number
                // that says whether Promptly is doing its job for a person.
                await markFirstAlert(subscriber.email);
              }
            } catch {}
            if (!delivered) {
              await releaseClaim(deliveryKey);
              try { await queueDigestItems(subscriber.email, queued); } catch {}
            }
          } else {
            try { await queueDigestItems(subscriber.email, queued); } catch {}
          }
        }
      }

      if (shouldSendWeekly && emailAllowed && subscriber.weeklyRecap !== false && subscriber.emailNotifications !== false && subscriber.email) {
        const recap = recapOpenings(live, subscriber);
        const deliveryKey = `weekly:${subscriber.email}:${weekKey(now)}`;
        const claimed = recap.length && await claimOnce(deliveryKey, 8 * 86400);
        if (claimed) {
          let delivered = false;
          try {
            delivered = Boolean((await sendWeeklyRecap(recap, subscriber, unsubToken)).sent);
            if (delivered) stats.weeklySent += 1;
          } catch {}
          if (!delivered) await releaseClaim(deliveryKey);
        }
      }

      if (subscriber.deadlineReminders === false) continue;
      for (const opening of subscriber.savedAlerts || []) {
        const daysLeft = daysUntil(opening.deadline, now);
        if (![7, 1].includes(daysLeft)) continue;
        const identity = encodeURIComponent(opening.sourceUrl || `${opening.company}|${opening.role}`).slice(0, 180);
        const deliveryKey = `deadline:${subscriber.email}:${identity}:${daysLeft}`;
        const claimed = await claimOnce(deliveryKey, 10 * 86400);
        if (!claimed) continue;
        let delivered = false;
        if (emailAllowed && subscriber.emailNotifications !== false && subscriber.email) {
          try {
            if ((await sendDeadlineReminder(opening, subscriber, daysLeft, unsubToken)).sent) {
              stats.reminderEmails += 1;
              delivered = true;
            }
          } catch {}
        }
        if (subscriber.pushNotifications !== false && subscriber.pushSubscription) {
          try {
            if ((await sendDeadlinePush(opening, subscriber, daysLeft)).sent) {
              stats.reminderPushes += 1;
              delivered = true;
            }
          } catch {}
        }
        if (!delivered) await releaseClaim(deliveryKey);
      }
    }
    });

    await recordRun("retention", { ok: true, stats });
    // Sent after the work, so the numbers reported are this run's. Never allowed
    // to fail the cron — a broken status email must not stop real alerts.
    const heartbeat = await sendHeartbeat({ retentionStats: stats }).catch(() => ({ sent: false }));

    return res.status(200).json({ ok: true, ...stats, weeklyRun: shouldSendWeekly, linkCheck, privacyCleanup, heartbeat });
  } catch (error) {
    // Record the failure BEFORE responding. A cron whose only symptom is a 500
    // in a log nobody reads is exactly how alerts stop reaching students
    // without anyone noticing.
    await recordRun("retention", { ok: false, error: error.message });
    await sendHeartbeat({ retentionStats: null }).catch(() => {});
    return res.status(500).json({ error: error.message || "Retention alerts failed." });
  }
};

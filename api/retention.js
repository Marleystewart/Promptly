const { listSubscribers, claimOnce, releaseClaim } = require("./_shared/store");
const { getLiveOpenings, takeDigestItems, queueDigestItems } = require("./_shared/openings-store");
const { sendDailyDigest, sendWeeklyRecap, sendDeadlineReminder, sendDeadlinePush, matchesOpening } = require("./_shared/alerts");
const { getOrCreateUnsubToken } = require("./_shared/tokens");

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
    const stored = await listSubscribers();
    const livePayload = await getLiveOpenings();
    const live = livePayload.openings || [];
    const stats = { subscribers: stored.subscribers.length, digestsSent: 0, weeklySent: 0, reminderEmails: 0, reminderPushes: 0 };

    for (const subscriber of stored.subscribers) {
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
              if (delivered) stats.digestsSent += 1;
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

    return res.status(200).json({ ok: true, ...stats, weeklyRun: shouldSendWeekly });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Retention alerts failed." });
  }
};

const { listSubscribers, claimOnce, releaseClaim } = require("./_shared/store");
const { getLiveOpenings } = require("./_shared/openings-store");
const { sendWeeklyRecap, sendDeadlineReminder, sendDeadlinePush, matchesOpening } = require("./_shared/alerts");

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
  const secret = process.env.CRON_SECRET;
  const isVercelCron = Boolean(secret && req.headers.authorization === `Bearer ${secret}`);
  const provided = (req.query && req.query.secret) || "";
  if (secret && !isVercelCron && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const forceWeekly = req.query && req.query.mode === "weekly";
    const shouldSendWeekly = forceWeekly || now.getUTCDay() === 1;
    const stored = await listSubscribers();
    const livePayload = await getLiveOpenings();
    const live = livePayload.openings || [];
    const stats = { subscribers: stored.subscribers.length, weeklySent: 0, reminderEmails: 0, reminderPushes: 0 };

    for (const subscriber of stored.subscribers) {
      if (shouldSendWeekly && subscriber.weeklyRecap !== false && subscriber.emailNotifications !== false && subscriber.email) {
        const recap = recapOpenings(live, subscriber);
        const deliveryKey = `weekly:${subscriber.email}:${weekKey(now)}`;
        const claimed = recap.length && await claimOnce(deliveryKey, 8 * 86400);
        if (claimed) {
          let delivered = false;
          try {
            delivered = Boolean((await sendWeeklyRecap(recap, subscriber)).sent);
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
        if (subscriber.emailNotifications !== false && subscriber.email) {
          try {
            if ((await sendDeadlineReminder(opening, subscriber, daysLeft)).sent) {
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

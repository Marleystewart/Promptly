// Scheduled refresh: pulls live 2027 US internships from employer ATS feeds,
// stores them in Redis, and notifies matching subscribers about any listing
// that is NEW since the last run. Triggered by Vercel Cron (see vercel.json,
// each morning) and callable manually at /api/refresh-openings.
//
// If CRON_SECRET is set, manual calls must pass ?secret=.... Vercel Cron
// authenticates with the same secret in the Authorization header.

const { aggregateOpenings } = require("./_shared/aggregator");
const { saveLiveOpenings, getLiveOpenings, filterNeverAlerted, markAlerted } = require("./_shared/openings-store");
const { listSubscribers } = require("./_shared/store");
const { sendEmailAlert, sendPushAlert, matchesOpening } = require("./_shared/alerts");
const { recordNewListings } = require("./_shared/analytics");

// Don't blast more than this many alerts in a single run (safety valve).
const MAX_NOTIFY_OPENINGS = 25;

async function notifySubscribers(newOpenings) {
  if (!newOpenings.length) return { notified: 0, emailSent: 0, pushSent: 0 };

  const stored = await listSubscribers();
  const subscribers = stored.subscribers || [];
  if (!subscribers.length) return { notified: 0, emailSent: 0, pushSent: 0 };

  let emailSent = 0;
  let pushSent = 0;
  const batch = newOpenings.slice(0, MAX_NOTIFY_OPENINGS);

  for (const opening of batch) {
    const matched = subscribers.filter((sub) => matchesOpening(opening, sub));
    for (const sub of matched) {
      if (sub.emailNotifications !== false && sub.email) {
        try { if ((await sendEmailAlert(opening, sub)).sent) emailSent += 1; } catch {}
      }
      if (sub.pushNotifications !== false && sub.pushSubscription) {
        try { if ((await sendPushAlert(opening, sub)).sent) pushSent += 1; } catch {}
      }
    }
  }
  return { notified: batch.length, emailSent, pushSent };
}

module.exports = async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const isVercelCron = Boolean(secret && req.headers.authorization === `Bearer ${secret}`);
  const provided = (req.query && req.query.secret) || "";
  if (secret && !isVercelCron && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // What did we have last time? (used to detect brand-new listings)
    const previous = await getLiveOpenings();
    const isFirstRun = !previous.updatedAt;
    const knownUrls = new Set((previous.openings || []).map((o) => o.sourceUrl));

    // Pull the current live set.
    const result = await aggregateOpenings();

    // Stamp when each listing was first seen (carried over between runs) so
    // the app can honestly show what's recent.
    const previousFirstSeen = new Map((previous.openings || []).map((o) => [o.sourceUrl, o.firstSeen]));
    for (const o of result.openings) {
      o.firstSeen = previousFirstSeen.get(o.sourceUrl) || result.updatedAt;
    }

    const payload = {
      openings: result.openings,
      updatedAt: result.updatedAt,
      count: result.openings.length,
    };
    const saved = await saveLiveOpenings(payload);

    // A listing is "new" only if it wasn't in the last run AND we've never
    // alerted on it before (protects against a source blipping out for a day
    // and re-triggering alerts for every listing when it recovers).
    const candidates = result.openings.filter((o) => !knownUrls.has(o.sourceUrl));
    const neverAlertedUrls = new Set(await filterNeverAlerted(candidates.map((o) => o.sourceUrl)));
    const newOpenings = candidates.filter((o) => neverAlertedUrls.has(o.sourceUrl));
    await markAlerted(result.openings.map((o) => o.sourceUrl));

    // On the very first run we seed silently (everything would look "new").
    const notify = isFirstRun ? { notified: 0, emailSent: 0, pushSent: 0, seeded: true } : await notifySubscribers(newOpenings);
    if (!isFirstRun) await recordNewListings(newOpenings.length);

    return res.status(200).json({
      ok: true,
      stored: saved.saved,
      count: payload.count,
      newListings: newOpenings.length,
      notifications: notify,
      updatedAt: payload.updatedAt,
      sources: result.sourceStatus,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Refresh failed" });
  }
};

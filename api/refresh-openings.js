// Scheduled refresh: pulls live 2027 US internships from employer ATS feeds,
// stores them in Redis, and notifies matching subscribers about any listing
// that is NEW since the last run. Triggered by Vercel Cron (see vercel.json,
// each morning) and callable manually at /api/refresh-openings.
//
// If CRON_SECRET is set, manual calls must pass ?secret=.... Vercel Cron
// authenticates with the same secret in the Authorization header.

const { aggregateOpenings } = require("./_shared/aggregator");
const { saveLiveOpenings, getLiveOpenings, filterNeverAlerted, markAlerted, queueDigestItems } = require("./_shared/openings-store");
const { forEachSubscriberBatch } = require("./_shared/store");
const { sendPushAlert, matchesOpening } = require("./_shared/alerts");
const { recordNewListings } = require("./_shared/analytics");
const { recordSourceHealth } = require("./_shared/source-health");

// Don't blast more than this many alerts in a single run (safety valve).
const MAX_NOTIFY_OPENINGS = 25;

// Push alerts go out instantly ("be first" is the product). Email matches are
// QUEUED per subscriber instead of sent — the daily retention cron flushes
// each queue as one digest email, so nobody's inbox gets flooded.
async function notifySubscribers(newOpenings) {
  if (!newOpenings.length) return { notified: 0, emailQueued: 0, pushSent: 0 };

  let emailQueued = 0;
  let pushSent = 0;
  let scanned = 0;
  const batch = newOpenings.slice(0, MAX_NOTIFY_OPENINGS);

  // Batched, not "load every subscriber into memory". This runs hourly, so at
  // scale the old fan-out was 100k concurrent Redis reads and 100k records
  // resident at once — it would exhaust memory and the connection pool long
  // before it finished sending anything.
  await forEachSubscriberBatch(async (subscribers) => {
    scanned += subscribers.length;
    for (const sub of subscribers) {
      const matched = batch.filter((opening) => matchesOpening(opening, sub));
      if (!matched.length) continue;

      // Don't even queue mail for an address that hasn't confirmed — otherwise a
      // queue builds up for someone who never asked to hear from us.
      if (sub.verified === true && sub.emailNotifications !== false && sub.email) {
        try {
          const { queued } = await queueDigestItems(sub.email, matched);
          emailQueued += queued;
        } catch {}
      }
      if (sub.pushNotifications !== false && sub.pushSubscription) {
        for (const opening of matched) {
          try { if ((await sendPushAlert(opening, sub)).sent) pushSent += 1; } catch {}
        }
      }
    }
  });

  return { notified: batch.length, emailQueued, pushSent, subscribersScanned: scanned };
}

module.exports = async function handler(req, res) {
  // Fail CLOSED. This used to skip the check entirely when CRON_SECRET was
  // unset, which left a expensive full-refresh endpoint publicly triggerable.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: "Refresh is not configured. Set CRON_SECRET in the deployment environment." });
  }
  const isVercelCron = req.headers.authorization === `Bearer ${secret}`;
  const provided = (req.query && req.query.secret) || "";
  if (!isVercelCron && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // What did we have last time? (used to detect brand-new listings)
    const previous = await getLiveOpenings();
    const isFirstRun = !previous.updatedAt;
    const knownUrls = new Set((previous.openings || []).map((o) => o.sourceUrl));

    // Pull the current live set.
    const result = await aggregateOpenings();

    // Record per-source health against its stored baseline, so a scraper that
    // silently stops producing is visible instead of just quietly missing.
    // Never blocks the refresh — a health write failing is not a refresh
    // failure.
    await recordSourceHealth(result.sourceStatus).catch(() => {});

    // Stamp when each listing was first seen (carried over between runs) so
    // the app can honestly show what's recent.
    // firstSeen: when this posting first appeared. lastVerified: the most
    // recent run that found it STILL in the employer's own feed.
    //
    // lastVerified is the real verification signal, and it is stronger than
    // pinging the apply URL. URL checking was evaluated and rejected: a
    // fabricated Greenhouse job id returns HTTP 200 and lands on a live careers
    // page, while a genuine Point72 posting redirects to its board root and
    // Cloudflare-protected employers (Akuna, Epic Games) return 403 for real,
    // working links. Status codes would therefore delete valid roles and keep
    // dead ones. Presence in the source feed cannot be faked that way — when a
    // req is pulled, it leaves the API and the next refresh drops it.
    const previousFirstSeen = new Map((previous.openings || []).map((o) => [o.sourceUrl, o.firstSeen]));
    for (const o of result.openings) {
      o.firstSeen = previousFirstSeen.get(o.sourceUrl) || result.updatedAt;
      o.lastVerified = result.updatedAt;
    }

    // What disappeared from the employer's feed since the last run. These are
    // filled or withdrawn reqs — reported so the drop rate is observable
    // instead of silent.
    const currentUrls = new Set(result.openings.map((o) => o.sourceUrl));
    const dropped = (previous.openings || []).filter((o) => !currentUrls.has(o.sourceUrl));

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
    const notify = isFirstRun ? { notified: 0, emailQueued: 0, pushSent: 0, seeded: true } : await notifySubscribers(newOpenings);
    if (!isFirstRun) await recordNewListings(newOpenings.length);

    return res.status(200).json({
      ok: true,
      stored: saved.saved,
      count: payload.count,
      newListings: newOpenings.length,
      droppedListings: dropped.length,
      notifications: notify,
      updatedAt: payload.updatedAt,
      sources: result.sourceStatus,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Refresh failed" });
  }
};

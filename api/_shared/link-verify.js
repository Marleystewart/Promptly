// Content check on live sourceUrls. Runs from inside the daily retention
// cron (not a separate function — see api/api-functions test, which enforces
// Vercel Hobby's 12-function cap; this project is already at that limit).
//
// WHY THIS FLAGS INSTEAD OF DELETING:
// A prior investigation proved no single link signal is trustworthy alone:
//   - a FABRICATED Greenhouse job id returns HTTP 200 and lands on a real
//     careers page
//   - a GENUINE Point72 posting redirects to its board root, also 200
//   - Akuna Capital and Epic Games — real, working links — return 403 from
//     bot protection
// Page TEXT lies too: tested against a real Blue Origin posting and got a
// false positive from "applications accepted on an ongoing basis UNTIL the
// requisition is closed" — future/conditional boilerplate, not a statement
// that this posting is closed. Fixed by excluding matches preceded by
// until/unless/once/when, but the fact that real production text tripped it
// on the first live test is exactly why this only flags, never deletes.
//
// The one signal that cannot be faked is presence in the employer's own ATS
// feed — the hourly refresh already enforces that, dropping a listing the
// moment it leaves the source. This is a second, weaker, corroborating check.
// A human decides what to do with a flag; nothing here mutates the live feed.

const RESULT_KEY = "promptly:verify:last-run";
const SLICE_SIZE = 60;           // per day — a full pass covers ~everything weekly
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 12000;

const DEAD_LANGUAGE = /this (position|job|role|posting) (is |has been |are )?(no longer available|closed|filled)|position (has been |is )?filled|job (has been |is )?filled|page not found|404 error|requisition[s]? (is |are |has been )?(closed|no longer available)/gi;
const CONDITIONAL_PREFIX = /\b(until|unless|once|when)\s+[a-z\s,-]{0,25}$/i;

function hasDeadLanguage(body) {
  const text = String(body || "");
  let match;
  DEAD_LANGUAGE.lastIndex = 0;
  while ((match = DEAD_LANGUAGE.exec(text))) {
    const before = text.slice(Math.max(0, match.index - 40), match.index);
    if (!CONDITIONAL_PREFIX.test(before)) return true;
    if (DEAD_LANGUAGE.lastIndex === match.index) DEAD_LANGUAGE.lastIndex += 1; // zero-width guard
  }
  return false;
}

async function checkOne(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyVerify/1.0)" },
    });
    // Bot-protection responses are common on real, working employer sites
    // (Cloudflare, Akamai) and were proven to hit genuine listings.
    if (res.status === 403 || res.status === 429 || res.status === 503) {
      return { signal: "blocked", httpStatus: res.status };
    }
    if (res.status >= 500) return { signal: "server_error", httpStatus: res.status };
    const body = await res.text().catch(() => "");
    return { signal: hasDeadLanguage(body) ? "dead_language" : "ok", httpStatus: res.status };
  } catch (error) {
    return { signal: "unreachable", error: String(error.message || error).slice(0, 80) };
  }
}

async function checkBatch(urls) {
  const results = new Array(urls.length);
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const i = cursor++;
      results[i] = await checkOne(urls[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
  return results;
}

// Unresolved student reports, keyed by the URL they reported. A report that a
// human has already reviewed and marked resolved stops influencing anything.
function reportedUrlCounts(reports = []) {
  const counts = new Map();
  for (const report of reports) {
    if (!report || report.resolved === true) continue;
    const url = String(report.url || "").trim();
    if (!url) continue;
    counts.set(url, (counts.get(url) || 0) + (Number(report.count) || 1));
  }
  return counts;
}

// Which listings get checked today.
//
// The rotating window alone gives every listing a turn, but with ~580 live
// listings and a 60/day budget a reported link waits about ten days for its
// turn — long enough that the report is worthless. A student telling us a link
// is broken is the strongest prioritisation signal available, so reported
// listings jump the queue; the rotating window then fills the remaining budget
// so full coverage still happens.
function pickSlice(openings, reportedCounts = new Map(), now = Date.now()) {
  const budget = Math.min(SLICE_SIZE, openings.length);
  const chosen = [];
  const seen = new Set();

  const reportedLive = openings
    .filter((o) => reportedCounts.get(o.sourceUrl))
    .sort((a, b) => (reportedCounts.get(b.sourceUrl) || 0) - (reportedCounts.get(a.sourceUrl) || 0));

  for (const opening of reportedLive) {
    if (chosen.length >= budget) break;
    if (seen.has(opening.sourceUrl)) continue;
    seen.add(opening.sourceUrl);
    chosen.push(opening);
  }

  const dayIndex = Math.floor(now / 86400000);
  const start = (dayIndex * SLICE_SIZE) % openings.length;
  for (let i = 0; i < openings.length && chosen.length < budget; i += 1) {
    const opening = openings[(start + i) % openings.length];
    if (seen.has(opening.sourceUrl)) continue;
    seen.add(opening.sourceUrl);
    chosen.push(opening);
  }

  return chosen;
}

// Combine the two independent signals into one state for a human to act on.
//
// Neither signal is trusted alone — that is the whole lesson of this file's
// header. Red requires BOTH a student report and dead-language text, because
// each has been observed to be wrong by itself. Anything unreachable stays
// "unknown" rather than red: bot protection and timeouts routinely hit real,
// working listings, and unknown beats incorrect.
function confidenceFor({ signal, reportCount = 0 }) {
  const reported = Number(reportCount) > 0;

  if (signal === "dead_language" && reported) {
    return { state: "red", reason: "A student report and the page's own text agree this posting is closed." };
  }
  if (signal === "dead_language") {
    return { state: "amber", reason: "Page text suggests the posting closed, but nobody reported it. Text alone has produced false positives before." };
  }
  if (reported && signal === "ok") {
    return { state: "amber", reason: "Reported by a student, but the page reads as live — may be wrong company or details rather than a dead link." };
  }
  if (reported) {
    return { state: "amber", reason: `Reported by a student and the page could not be checked (${signal}).` };
  }
  if (signal === "ok") {
    return { state: "green", reason: "Checked and reads as live." };
  }
  return { state: "unknown", reason: `Could not be checked (${signal}). Bot protection and timeouts hit real, working listings — this is not evidence of a problem.` };
}

// Called once per retention run. Never throws — a verification failure must
// not interrupt the digest/reminder sends that are the actual point of the
// cron it lives inside.
async function runLinkVerification({ getRedis, openings, reports = [] }) {
  try {
    if (!openings || !openings.length) return { checked: 0, skipped: "no live openings" };

    const reportedCounts = reportedUrlCounts(reports);
    const slice = pickSlice(openings, reportedCounts);
    const prioritised = slice.filter((o) => reportedCounts.get(o.sourceUrl)).length;

    const results = await checkBatch(slice.map((o) => o.sourceUrl));

    const assessed = slice.map((o, i) => {
      const reportCount = reportedCounts.get(o.sourceUrl) || 0;
      const { state, reason } = confidenceFor({ signal: results[i].signal, reportCount });
      return {
        company: o.company,
        role: o.role,
        sourceUrl: o.sourceUrl,
        ...results[i],
        reportCount,
        confidence: state,
        confidenceReason: reason,
      };
    });

    // Keep everything that isn't confidently fine, so a reported-but-readable
    // listing is still visible for review instead of silently dropping out.
    const flagged = assessed.filter((r) => r.confidence === "red" || r.confidence === "amber");

    const summary = { ok: 0, blocked: 0, server_error: 0, dead_language: 0, unreachable: 0 };
    results.forEach((r) => { summary[r.signal] = (summary[r.signal] || 0) + 1; });
    summary.red = flagged.filter((f) => f.confidence === "red").length;
    summary.amber = flagged.filter((f) => f.confidence === "amber").length;
    summary.prioritisedByReports = prioritised;

    const redis = await getRedis();
    if (redis) {
      const checkedUrls = new Set(slice.map((o) => o.sourceUrl));
      const stillLive = new Set(openings.map((o) => o.sourceUrl));
      const existing = (await redis.get(RESULT_KEY)) || { flagged: [] };
      // Carry forward prior flags not re-checked today, so a flag survives
      // until either the listing disappears from the feed or gets re-checked.
      const carried = existing.flagged.filter((f) => stillLive.has(f.sourceUrl) && !checkedUrls.has(f.sourceUrl));
      await redis.set(RESULT_KEY, {
        checkedAt: new Date().toISOString(),
        checked: slice.length,
        totalLive: openings.length,
        summary,
        flagged: [...carried, ...flagged].slice(0, 200),
      });
    }

    return { checked: slice.length, flaggedThisRun: flagged.length, prioritisedByReports: prioritised };
  } catch (error) {
    return { checked: 0, error: String(error.message || error).slice(0, 120) };
  }
}

module.exports = { runLinkVerification, hasDeadLanguage, pickSlice, confidenceFor, reportedUrlCounts };

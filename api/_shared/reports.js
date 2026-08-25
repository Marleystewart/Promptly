// ─────────────────────────────────────────────────────────────────────────
// User-reported listing problems.
//
// The registry monitors hundreds of employer feeds, which is far past the
// point where anyone can eyeball every listing. Students are the ones who
// actually click through, so they are the fastest signal that a posting is
// dead, misleading, or pointing at the wrong place — but only if reporting
// takes one tap.
//
// Reports are corroborating signal, NEVER an automatic removal: a single
// click must not be able to delete a real listing for everyone else, and a
// wrong report is itself a data-quality failure. Same standing rule as the
// content-checker in link-verify.js — flag, review, then act.
// ─────────────────────────────────────────────────────────────────────────

const { getRedis, opaqueKeyPart } = require("./store");

const REPORTS_KEY = "promptly:listing-reports";       // hash: id -> report JSON
const REPORT_RATE_KEY = "promptly:report-rate";        // per-reporter counter
const MAX_REPORTS = 500;                               // keep the hash bounded
const REPORT_TTL_DAYS = 90;

// What a student can tell us without guessing. Free-text goes in `note`.
const REASONS = {
  "dead-link": "Link is broken or 404s",
  "closed": "Posting is closed or filled",
  "not-internship": "Not a student/intern role",
  "wrong-location": "Location is wrong",
  "wrong-company": "Wrong company or details",
  "other": "Something else",
};

function isValidReason(reason) {
  return Object.prototype.hasOwnProperty.call(REASONS, String(reason || ""));
}

// One id per (company + url) so repeat reports of the SAME listing aggregate
// into one row with a count, rather than flooding the review queue.
function reportId(company, url) {
  const key = `${String(company || "").toLowerCase().trim()}|${String(url || "").trim()}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return `r${Math.abs(hash).toString(36)}`;
}

// Cheap abuse guard. The report form is unauthenticated by design (asking a
// student to log in before telling us a link is broken would mean we never
// hear about broken links), so cap per reporter per hour.
async function takeReportSlot(requester = "unknown") {
  const redis = await getRedis();
  if (!redis) return { allowed: true, stored: false };
  const key = `${REPORT_RATE_KEY}:${opaqueKeyPart(String(requester).slice(0, 64))}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 3600);
  return { allowed: count <= 20, stored: true };
}

async function recordReport({ company, role, location, url, reason, note, requester }) {
  const redis = await getRedis();
  if (!redis) return { ok: false, error: "Reporting is not configured." };
  if (!company || !isValidReason(reason)) return { ok: false, error: "Invalid report." };

  const id = reportId(company, url);
  const now = new Date().toISOString();

  let existing = await redis.hget(REPORTS_KEY, id);
  if (typeof existing === "string") { try { existing = JSON.parse(existing); } catch { existing = null; } }

  const reasons = new Set(Array.isArray(existing?.reasons) ? existing.reasons : []);
  reasons.add(reason);
  // Keep a few notes rather than only the newest — different reporters often
  // describe different halves of the same problem.
  const notes = Array.isArray(existing?.notes) ? existing.notes.slice(-4) : [];
  const trimmedNote = String(note || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (trimmedNote) notes.push({ note: trimmedNote, at: now });

  const record = {
    id,
    company: String(company).slice(0, 80),
    role: String(role || "").slice(0, 120),
    location: String(location || "").slice(0, 160),
    url: String(url || "").slice(0, 500),
    reasons: [...reasons],
    notes,
    count: (Number(existing?.count) || 0) + 1,
    // The report form never asks the student to share contact details, so an
    // account email collected for alerts must not be silently repurposed here.
    lastReporterEmail: null,
    firstReportedAt: existing?.firstReportedAt || now,
    lastReportedAt: now,
    expiresAt: new Date(Date.now() + REPORT_TTL_DAYS * 86400000).toISOString(),
    resolved: false, // set by hand after review; never automatically
  };

  await redis.hset(REPORTS_KEY, { [id]: JSON.stringify(record) });

  // Bound the hash so a burst can't grow it without limit.
  try {
    const all = (await redis.hgetall(REPORTS_KEY)) || {};
    const keys = Object.keys(all);
    if (keys.length > MAX_REPORTS) {
      const parsed = keys.map((k) => {
        let v = all[k];
        if (typeof v === "string") { try { v = JSON.parse(v); } catch { v = null; } }
        return { k, at: v?.lastReportedAt || "" };
      }).sort((a, b) => String(a.at).localeCompare(String(b.at)));
      const drop = parsed.slice(0, keys.length - MAX_REPORTS).map((p) => p.k);
      if (drop.length) await redis.hdel(REPORTS_KEY, ...drop);
    }
  } catch {}

  return { ok: true, report: record };
}

function reportExpired(report, now = new Date()) {
  const expiry = Date.parse(report?.expiresAt || "");
  if (Number.isFinite(expiry)) return expiry <= now.getTime();
  const last = Date.parse(report?.lastReportedAt || report?.firstReportedAt || "");
  return Number.isFinite(last) && last + REPORT_TTL_DAYS * 86400000 <= now.getTime();
}

// Daily minimization for both new and legacy reports. Old rows may contain an
// account email because earlier clients attached it without asking; scrub that
// field immediately and remove reports after the operational review window.
async function pruneReports(now = new Date()) {
  const redis = await getRedis();
  if (!redis) return { removed: 0, scrubbed: 0, stored: false };
  const raw = (await redis.hgetall(REPORTS_KEY)) || {};
  const remove = [];
  const updates = {};
  let scrubbed = 0;

  for (const [id, value] of Object.entries(raw)) {
    let report = value;
    if (typeof report === "string") { try { report = JSON.parse(report); } catch { report = null; } }
    if (!report || reportExpired(report, now)) {
      remove.push(id);
      continue;
    }
    if (report.lastReporterEmail || !report.expiresAt) {
      const reportedAt = Date.parse(report.lastReportedAt || report.firstReportedAt || "");
      const retentionStart = Number.isFinite(reportedAt) ? reportedAt : now.getTime();
      updates[id] = JSON.stringify({
        ...report,
        lastReporterEmail: null,
        expiresAt: report.expiresAt || new Date(retentionStart + REPORT_TTL_DAYS * 86400000).toISOString(),
      });
      scrubbed += 1;
    }
  }

  if (remove.length) await redis.hdel(REPORTS_KEY, ...remove);
  if (Object.keys(updates).length) await redis.hset(REPORTS_KEY, updates);
  return { removed: remove.length, scrubbed, stored: true };
}

async function listReports() {
  try {
    const redis = await getRedis();
    if (!redis) return [];
    const raw = (await redis.hgetall(REPORTS_KEY)) || {};
    return Object.values(raw)
      .map((v) => {
        if (typeof v === "string") { try { return JSON.parse(v); } catch { return null; } }
        return v;
      })
      .filter(Boolean)
      .filter((report) => !reportExpired(report))
      .sort((a, b) => (b.count - a.count) || String(b.lastReportedAt).localeCompare(String(a.lastReportedAt)));
  } catch {
    return [];
  }
}

module.exports = {
  recordReport,
  listReports,
  takeReportSlot,
  pruneReports,
  reportExpired,
  isValidReason,
  reportId,
  REASONS,
  REPORTS_KEY,
  REPORT_TTL_DAYS,
};

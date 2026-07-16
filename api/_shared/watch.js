// ─────────────────────────────────────────────────────────────────────────
// "Watch any company" — turns a careers URL into a real, watchable ATS
// source when we can, and honestly logs a coverage request when we can't.
//
// detectSource(url) recognises the public ATS platforms Promptly already
// pulls (Greenhouse, Lever, Ashby, Workday, SmartRecruiters) and extracts the
// board token. Those are the ONLY hosts we ever fetch — a pasted URL can never
// make us request an arbitrary server. If the URL isn't a known ATS board,
// detection returns null and the caller logs it as a coverage request instead
// of pretending to watch it.
// ─────────────────────────────────────────────────────────────────────────

const { fetchOne } = require("./aggregator");
const { addWatchedSource, removeWatcher, logCoverageRequest, sourceId } = require("./watched-store");

// Turn a board token like "databricks" or "acme-corp" into a display name.
function prettifyToken(token) {
  return String(token || "")
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")   // camelCase → spaced
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
    .slice(0, 60);
}

function shortFromCompany(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Locale segments (en-US, fr_FR, etc.) that Workday puts in front of the site.
const LOCALE = /^[a-z]{2}([-_][A-Za-z]{2})?$/;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Parse a careers URL into an ATS source config the aggregator understands,
// or null if it isn't a recognised public board.
function detectSource(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl).trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").map((s) => decodeURIComponent(s)).filter(Boolean);
  const first = segments[0];

  // ── Greenhouse ──────────────────────────────────────────────────────────
  // boards.greenhouse.io/TOKEN, job-boards.greenhouse.io/TOKEN,
  // boards.greenhouse.io/embed/job_board?for=TOKEN, TOKEN.greenhouse.io
  if (host.endsWith("greenhouse.io")) {
    const forParam = url.searchParams.get("for");
    let board = null;
    if (forParam && TOKEN.test(forParam)) board = forParam;
    else if (first && first !== "embed" && TOKEN.test(first)) board = first;
    else if (host !== "greenhouse.io" && host !== "boards.greenhouse.io" && host !== "job-boards.greenhouse.io") {
      const sub = host.replace(/\.greenhouse\.io$/, "");
      if (TOKEN.test(sub) && sub !== "boards" && sub !== "job-boards") board = sub;
    }
    if (board) return { ats: "greenhouse", board };
  }

  // ── Lever ───────────────────────────────────────────────────────────────
  // jobs.lever.co/TOKEN
  if (host.endsWith("lever.co") && first && TOKEN.test(first)) {
    return { ats: "lever", board: first };
  }

  // ── Ashby ───────────────────────────────────────────────────────────────
  // jobs.ashbyhq.com/TOKEN
  if (host.endsWith("ashbyhq.com") && first && TOKEN.test(first)) {
    return { ats: "ashby", board: first };
  }

  // ── SmartRecruiters ───────────────────────────────────────────────────────
  // jobs.smartrecruiters.com/TOKEN, careers.smartrecruiters.com/TOKEN
  if (host.endsWith("smartrecruiters.com") && first && TOKEN.test(first)) {
    return { ats: "smartrecruiters", board: first };
  }

  // ── Workday ───────────────────────────────────────────────────────────────
  // TENANT.DC.myworkdayjobs.com/[locale/]SITE...
  if (host.endsWith("myworkdayjobs.com")) {
    const parts = host.split(".");
    // [tenant, dc, myworkdayjobs, com] — dc looks like wd1 / wd5 / wd103
    if (parts.length >= 4 && /^wd\d+$/.test(parts[1])) {
      const tenant = parts[0];
      const dc = parts[1];
      const site = segments.find((s) => !LOCALE.test(s));
      if (tenant && site && TOKEN.test(tenant) && TOKEN.test(site)) {
        return { ats: "workday", tenant, dc, site };
      }
    }
  }

  return null;
}

// Flesh a detected config out into a full source record (company name, short
// code, field) the aggregator's normalize() and the frontend can render.
function buildSource(detected, companyName) {
  const token = detected.board || detected.tenant;
  const company = String(companyName || "").trim() || prettifyToken(token);
  return {
    ...detected,
    company,
    short: shortFromCompany(company),
    field: "Watched",
    subField: "",
  };
}

// Confirm the board actually resolves by running its real fetcher. Returns the
// number of current student-relevant openings (0 is fine — we still watch;
// a thrown/blank result means the board token was wrong).
async function probeSource(src) {
  const openings = await fetchOne(src);
  return Array.isArray(openings) ? openings : [];
}

// Orchestrate a watch request end to end.
//   { url, company?, email? }
// → { status: "watching" | "logged" | "invalid" | "at_capacity" | "unreachable", ... }
async function watchCompany({ url, company = "", email = "" }) {
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return { status: "invalid", reason: "Enter a company careers link." };

  const detected = detectSource(rawUrl);
  if (!detected) {
    // Not a board we can read — log honestly as a coverage request, no promise.
    await logCoverageRequest(rawUrl, { company, email }).catch(() => {});
    return {
      status: "logged",
      reason: "We can’t automatically read that page’s format yet, so we logged it for our team to add. We’ll never claim to watch a page we can’t actually read.",
    };
  }

  const src = buildSource(detected, company);

  let sample;
  try {
    sample = await probeSource(src);
  } catch {
    return {
      status: "unreachable",
      company: src.company,
      reason: "That looks like a careers board, but we couldn’t reach it just now. Double-check the link and try again.",
    };
  }

  const result = await addWatchedSource(src, email);
  if (result.atCapacity) {
    return { status: "at_capacity", company: src.company, reason: "Promptly is at its watch-list capacity right now. Try again soon." };
  }
  if (!result.stored) {
    return { status: "unreachable", company: src.company, reason: "Couldn’t save that watch just now. Try again in a moment." };
  }

  return {
    status: "watching",
    id: result.record.id,
    company: src.company,
    ats: src.ats,
    openNow: sample.length,           // real count of current matching roles
  };
}

async function unwatchCompany({ id, email = "" }) {
  return removeWatcher(String(id || "").trim(), email);
}

module.exports = {
  detectSource,
  buildSource,
  probeSource,
  watchCompany,
  unwatchCompany,
  prettifyToken,
  sourceId,
};

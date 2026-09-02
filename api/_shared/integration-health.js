// Which optional data integrations are actually switched on.
//
// Some adapters no-op when their credentials are missing — fetchUsaJobs()
// returns [] with no error if USAJOBS_API_KEY / USAJOBS_EMAIL are unset. That
// is correct behaviour (a missing key must never break the whole refresh), but
// it is indistinguishable from "that source had nothing today", so an
// unconfigured integration can sit dead for weeks while the app looks healthy.
// The email outage went unnoticed the same way. Report it explicitly instead.

const { SOURCES } = require("./sources");

function usaJobsState() {
  const configured = Boolean(process.env.USAJOBS_API_KEY && process.env.USAJOBS_EMAIL);
  // How much coverage is riding on this one integration.
  const sources = SOURCES.filter((s) => s.ats === "usajobs").length;
  return {
    name: "USAJOBS",
    configured,
    sources,
    covers: "All federal agencies (student + recent-graduate hiring paths)",
    blockedReason: configured
      ? null
      : "USAJOBS_API_KEY and USAJOBS_EMAIL are not set in Vercel, so every federal listing is skipped. The adapter itself is verified working.",
  };
}

// "Set" is not "working". A key that is present but wrong looks identical from
// inside the process: fetchUsaJobs throws, Promise.allSettled swallows it, and
// the feed simply has no federal listings — the same shape as a quiet day.
// This spent a whole debugging session looking like a missing variable when it
// was a bad value, so the check actually calls USAJOBS and reports what it got.
//
// Shape hints are included because the value cannot be read back out of Vercel:
// a length far off 44, or a value still carrying "USAJOBS_API_KEY=", is almost
// always a paste that grabbed the whole line instead of just the value.
async function probeUsaJobs() {
  const key = String(process.env.USAJOBS_API_KEY || "");
  const email = String(process.env.USAJOBS_EMAIL || "");
  if (!key || !email) return { ok: false, reason: "not set" };

  const shape = {
    keyLength: key.length,
    keyLooksLikeWholeLine: /USAJOBS_API_KEY\s*=/.test(key),
    keyHasWhitespace: key !== key.trim(),
    emailLooksLikeWholeLine: /USAJOBS_EMAIL\s*=/.test(email),
    emailHasAt: email.includes("@"),
  };

  try {
    const res = await fetch("https://data.usajobs.gov/api/search?ResultsPerPage=1&HiringPath=student", {
      headers: { Host: "data.usajobs.gov", "User-Agent": email, "Authorization-Key": key },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 200) return { ok: true, status: 200, shape };
    return {
      ok: false,
      status: res.status,
      shape,
      reason: res.status === 401
        ? "USAJOBS rejected the credentials. The variables are set but the value is wrong."
        : `USAJOBS answered ${res.status}.`,
    };
  } catch (error) {
    return { ok: false, shape, reason: `Could not reach USAJOBS: ${String(error.message).slice(0, 60)}` };
  }
}

function readIntegrationHealth() {
  const integrations = [usaJobsState()];
  return {
    integrations,
    unconfigured: integrations.filter((i) => !i.configured).map((i) => i.name),
  };
}

module.exports = { readIntegrationHealth, usaJobsState, probeUsaJobs };

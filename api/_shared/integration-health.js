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

function readIntegrationHealth() {
  const integrations = [usaJobsState()];
  return {
    integrations,
    unconfigured: integrations.filter((i) => !i.configured).map((i) => i.name),
  };
}

module.exports = { readIntegrationHealth, usaJobsState };

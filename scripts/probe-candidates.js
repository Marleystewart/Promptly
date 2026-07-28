// Probe CANDIDATE sources before adding them to the registry.
//
// Adding a company we can't actually pull creates a permanent "Awaiting
// posting" card — exactly the trust problem we're trying to remove. So every
// candidate gets fetched live here first, and only boards that genuinely
// resolve get promoted into sources.js.
//
// Usage: node scripts/probe-candidates.js
//
// Reports per candidate:
//   OK    — board resolves; n = student-relevant roles found right now
//   EMPTY — board resolves but has no student roles today (still worth adding)
//   DEAD  — board token is wrong or the feed 404s (do NOT add)

const { fetchOne } = require("../api/_shared/aggregator");

// Candidate board tokens to verify. Guesses are cheap here — the probe is the
// filter. Grouped by the vertical they'd fill.
const CANDIDATES = [
  // ── Big tech / Fortune 500 reachable via public ATS ──────────────────
  { company: "Salesforce", short: "CRM", ats: "greenhouse", board: "salesforce", field: "Technology", subField: "Enterprise Software" },
  { company: "Adobe", short: "ADBE", ats: "greenhouse", board: "adobe", field: "Technology", subField: "Enterprise Software" },
  { company: "Intuit", short: "INTU", ats: "greenhouse", board: "intuit", field: "Technology", subField: "Enterprise Software" },
  { company: "ServiceNow", short: "NOW", ats: "greenhouse", board: "servicenow", field: "Technology", subField: "Enterprise Software" },
  { company: "Nvidia", short: "NVDA", ats: "greenhouse", board: "nvidia", field: "Technology", subField: "Semiconductors" },
  { company: "Qualcomm", short: "QCOM", ats: "greenhouse", board: "qualcomm", field: "Technology", subField: "Semiconductors" },
  { company: "Cisco", short: "CSCO", ats: "greenhouse", board: "cisco", field: "Technology", subField: "Enterprise Software" },
  { company: "Snowflake", short: "SNOW", ats: "greenhouse", board: "snowflake", field: "Technology", subField: "Data" },
  { company: "Atlassian", short: "TEAM", ats: "lever", board: "atlassian", field: "Technology", subField: "Enterprise Software" },
  { company: "Okta", short: "OKTA", ats: "greenhouse", board: "okta", field: "Technology", subField: "Security" },

  // ── Healthcare: systems + payers (currently only biotech/health-tech) ─
  { company: "Mayo Clinic", short: "MAYO", ats: "greenhouse", board: "mayoclinic", field: "Healthcare", subField: "Health Systems" },
  { company: "Cleveland Clinic", short: "CC", ats: "greenhouse", board: "clevelandclinic", field: "Healthcare", subField: "Health Systems" },
  { company: "Kaiser Permanente", short: "KP", ats: "greenhouse", board: "kaiserpermanente", field: "Healthcare", subField: "Health Systems" },
  { company: "UnitedHealth Group", short: "UNH", ats: "greenhouse", board: "unitedhealthgroup", field: "Healthcare", subField: "Payers" },
  { company: "CVS Health", short: "CVS", ats: "greenhouse", board: "cvshealth", field: "Healthcare", subField: "Payers" },
  { company: "Included Health", short: "IH", ats: "greenhouse", board: "includedhealth", field: "Healthcare", subField: "Health Tech" },
  { company: "Devoted Health", short: "DH", ats: "greenhouse", board: "devotedhealth", field: "Healthcare", subField: "Payers" },

  // ── Nonprofit / public interest (only 2 sources today) ───────────────
  { company: "Teach For America", short: "TFA", ats: "greenhouse", board: "teachforamerica", field: "Nonprofit", subField: "Education" },
  { company: "American Red Cross", short: "ARC", ats: "greenhouse", board: "americanredcross", field: "Nonprofit", subField: "Humanitarian" },
  { company: "Gates Foundation", short: "GF", ats: "greenhouse", board: "gatesfoundation", field: "Nonprofit", subField: "Philanthropy" },
  { company: "Environmental Defense Fund", short: "EDF", ats: "greenhouse", board: "environmentaldefensefund", field: "Nonprofit", subField: "Climate" },
  { company: "Robin Hood Foundation", short: "RH", ats: "greenhouse", board: "robinhoodfoundation", field: "Nonprofit", subField: "Philanthropy" },

  // ── Media / entertainment (only 2 sources today) ─────────────────────
  { company: "Netflix", short: "NFLX", ats: "lever", board: "netflix", field: "Media", subField: "Streaming" },
  { company: "The New York Times", short: "NYT", ats: "greenhouse", board: "thenewyorktimes", field: "Media", subField: "News" },
  { company: "NPR", short: "NPR", ats: "greenhouse", board: "npr", field: "Media", subField: "News" },
  { company: "Warner Bros. Discovery", short: "WBD", ats: "greenhouse", board: "warnerbrosdiscovery", field: "Media", subField: "Entertainment" },
  { company: "Condé Nast", short: "CN", ats: "greenhouse", board: "condenast", field: "Media", subField: "Publishing" },

  // ── Consumer brands (only DTC startups today) ────────────────────────
  { company: "Nike", short: "NKE", ats: "greenhouse", board: "nike", field: "Consumer", subField: "Apparel" },
  { company: "Procter & Gamble", short: "PG", ats: "greenhouse", board: "procterandgamble", field: "Consumer", subField: "CPG" },
  { company: "PepsiCo", short: "PEP", ats: "greenhouse", board: "pepsico", field: "Consumer", subField: "CPG" },
  { company: "Target", short: "TGT", ats: "greenhouse", board: "target", field: "Consumer", subField: "Retail" },
  { company: "Chewy", short: "CHWY", ats: "greenhouse", board: "chewy", field: "Consumer", subField: "Retail" },
  { company: "Warby Parker", short: "WRBY", ats: "greenhouse", board: "warbyparker", field: "Consumer", subField: "Retail" },

  // ── Aerospace / defense (thin under Engineering) ─────────────────────
  { company: "Lockheed Martin", short: "LMT", ats: "greenhouse", board: "lockheedmartin", field: "Engineering", subField: "Aerospace" },
  { company: "Northrop Grumman", short: "NOC", ats: "greenhouse", board: "northropgrumman", field: "Engineering", subField: "Aerospace" },
  { company: "Boeing", short: "BA", ats: "greenhouse", board: "boeing", field: "Engineering", subField: "Aerospace" },
  { company: "Blue Origin", short: "BO", ats: "greenhouse", board: "blueorigin", field: "Engineering", subField: "Aerospace" },
  { company: "Rocket Lab", short: "RKLB", ats: "greenhouse", board: "rocketlab", field: "Engineering", subField: "Aerospace" },
  { company: "Applied Intuition", short: "AI", ats: "greenhouse", board: "appliedintuition", field: "Engineering", subField: "Autonomy" },

  // ── Consulting (3 sources vs 13 unfed placeholders) ──────────────────
  { company: "Slalom", short: "SLA", ats: "greenhouse", board: "slalom", field: "Consulting", subField: "Technology Consulting" },
  { company: "Analysis Group", short: "AG", ats: "greenhouse", board: "analysisgroup", field: "Consulting", subField: "Economic Consulting" },
  { company: "Cornerstone Research", short: "CR", ats: "greenhouse", board: "cornerstoneresearch", field: "Consulting", subField: "Economic Consulting" },
  { company: "Bates White", short: "BW", ats: "greenhouse", board: "bateswhite", field: "Consulting", subField: "Economic Consulting" },

  // ── Education / edtech ───────────────────────────────────────────────
  { company: "Chegg", short: "CHGG", ats: "greenhouse", board: "chegg", field: "Education", subField: "EdTech" },
  { company: "Udemy", short: "UDMY", ats: "greenhouse", board: "udemy", field: "Education", subField: "EdTech" },

  // ── Sports (1 source today) ──────────────────────────────────────────
  { company: "DraftKings", short: "DKNG", ats: "greenhouse", board: "draftkings", field: "Sports", subField: "Sports Betting" },
  { company: "Fanatics", short: "FAN", ats: "greenhouse", board: "fanatics", field: "Sports", subField: "Commerce" },
];

const LIMIT = 6; // polite concurrency

async function probe(candidate) {
  try {
    const roles = await fetchOne(candidate);
    const n = Array.isArray(roles) ? roles.length : 0;
    return { candidate, status: n > 0 ? "OK" : "EMPTY", n };
  } catch (error) {
    return { candidate, status: "DEAD", n: 0, error: String(error.message || error).slice(0, 70) };
  }
}

(async () => {
  const results = [];
  for (let i = 0; i < CANDIDATES.length; i += LIMIT) {
    const batch = CANDIDATES.slice(i, i + LIMIT);
    results.push(...(await Promise.all(batch.map(probe))));
    process.stdout.write(".");
  }
  process.stdout.write("\n\n");

  const ok = results.filter((r) => r.status === "OK");
  const empty = results.filter((r) => r.status === "EMPTY");
  const dead = results.filter((r) => r.status === "DEAD");

  const line = (r) => `  ${r.candidate.company.padEnd(28)} ${r.candidate.ats}:${r.candidate.board}`;

  console.log(`OK (board live, has student roles now) — ${ok.length}`);
  ok.forEach((r) => console.log(line(r) + `  → ${r.n} roles`));
  console.log(`\nEMPTY (board live, no student roles today — safe to add) — ${empty.length}`);
  empty.forEach((r) => console.log(line(r)));
  console.log(`\nDEAD (do NOT add) — ${dead.length}`);
  dead.forEach((r) => console.log(line(r) + `  ✗ ${r.error}`));

  // Emit a ready-to-paste registry block for everything that resolved.
  const usable = [...ok, ...empty];
  if (usable.length) {
    console.log(`\n── sources.js entries for the ${usable.length} verified boards ──`);
    usable.forEach(({ candidate: c }) => {
      console.log(`  { company: ${JSON.stringify(c.company)}, short: ${JSON.stringify(c.short)}, ats: ${JSON.stringify(c.ats)}, board: ${JSON.stringify(c.board)}, field: ${JSON.stringify(c.field)}, subField: ${JSON.stringify(c.subField)} },`);
    });
  }
})();

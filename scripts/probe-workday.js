// Raw Workday tenant verifier.
//
// The Workday adapter in aggregator.js catches fetch errors and breaks, so a
// wrong tenant/site looks "empty" rather than failing. That's fine in
// production (a bad source must never crash the run) but useless for deciding
// whether a candidate is real. This probe talks to the endpoint directly and
// reports the actual HTTP status, so we only promote tenants that truly exist.
//
// Usage: node scripts/probe-workday.js

const CANDIDATES = [
  { company: "Nvidia", tenant: "nvidia", dc: "wd5", site: "NVIDIAExternalCareerSite" },
  { company: "Salesforce", tenant: "salesforce", dc: "wd12", site: "External_Career_Site" },
  { company: "Adobe", tenant: "adobe", dc: "wd5", site: "external_experienced" },
  { company: "Cisco", tenant: "cisco", dc: "wd1", site: "at_cisco" },
  { company: "Target", tenant: "target", dc: "wd5", site: "targetcareers" },
  { company: "Nike", tenant: "nike", dc: "wd1", site: "nike" },
  { company: "Boeing", tenant: "boeing", dc: "wd1", site: "EXTERNAL_CAREERS" },
  { company: "Lockheed Martin", tenant: "lockheedmartin", dc: "wd1", site: "External" },
  { company: "Northrop Grumman", tenant: "ngc", dc: "wd1", site: "Northrop_Grumman_External_Site" },
  { company: "CVS Health", tenant: "cvshealth", dc: "wd1", site: "CVS_Health_Careers" },
  { company: "Kaiser Permanente", tenant: "kaiser", dc: "wd1", site: "KPCareers" },
  { company: "Mayo Clinic", tenant: "mayoclinic", dc: "wd1", site: "Mayo_Clinic_Careers" },
  { company: "Intuit", tenant: "intuit", dc: "wd1", site: "external" },
  { company: "ServiceNow", tenant: "servicenow", dc: "wd1", site: "ServiceNow" },
  { company: "Qualcomm", tenant: "qualcomm", dc: "wd5", site: "External" },
  { company: "PepsiCo", tenant: "pepsico", dc: "wd3", site: "PepsiCoCareers" },
  { company: "Procter & Gamble", tenant: "pg", dc: "wd5", site: "PGCareers" },
  { company: "UnitedHealth Group", tenant: "unitedhealthgroup", dc: "wd1", site: "UnitedHealthGroup" },
  { company: "Sony", tenant: "sony", dc: "wd1", site: "SonyGlobalCareers" },
  { company: "Comcast NBCUniversal", tenant: "comcast", dc: "wd5", site: "Comcast_Careers" },
];

async function check(c) {
  const base = `https://${c.tenant}.${c.dc}.myworkdayjobs.com`;
  const api = `${base}/wday/cxs/${c.tenant}/${c.site}/jobs`;
  try {
    const res = await fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: 0, searchText: "intern" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { c, ok: false, why: `HTTP ${res.status}` };
    const data = await res.json();
    const total = data.total ?? (Array.isArray(data.jobPostings) ? data.jobPostings.length : 0);
    const sample = (data.jobPostings || []).slice(0, 2).map((p) => p.title);
    return { c, ok: true, total, sample };
  } catch (error) {
    return { c, ok: false, why: String(error.message || error).slice(0, 60) };
  }
}

(async () => {
  const results = [];
  for (let i = 0; i < CANDIDATES.length; i += 5) {
    results.push(...(await Promise.all(CANDIDATES.slice(i, i + 5).map(check))));
    process.stdout.write(".");
  }
  process.stdout.write("\n\n");

  const live = results.filter((r) => r.ok);
  const dead = results.filter((r) => !r.ok);

  console.log(`LIVE tenants — ${live.length}`);
  live.forEach((r) =>
    console.log(`  ${r.c.company.padEnd(22)} ${r.c.tenant}.${r.c.dc}/${r.c.site}  total=${r.total}  e.g. ${(r.sample[0] || "—").slice(0, 46)}`)
  );
  console.log(`\nDEAD — ${dead.length}`);
  dead.forEach((r) => console.log(`  ${r.c.company.padEnd(22)} ${r.c.tenant}.${r.c.dc}/${r.c.site}  ✗ ${r.why}`));

  if (live.length) {
    console.log(`\n── sources.js entries ──`);
    live.forEach(({ c }) =>
      console.log(`  { company: ${JSON.stringify(c.company)}, short: "", ats: "workday", tenant: ${JSON.stringify(c.tenant)}, dc: ${JSON.stringify(c.dc)}, site: ${JSON.stringify(c.site)}, field: "", subField: "" },`)
    );
  }
})();

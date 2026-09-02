#!/usr/bin/env node
// Find which applicant-tracking system an employer actually uses.
//
// Guessing board tokens does not work and is dangerous: SmartRecruiters returns
// HTTP 200 with totalFound:0 for ANY string, and a token that resolves is not
// proof of ownership (ashby:silver is Silver.dev, not Silver Lake). So this
// discovers instead of guessing — it fetches the employer's own careers pages
// and reads the ATS URL out of the markup, which carries the real token, and
// for Workday the tenant + datacenter + site together.
//
// Output is a candidate, never a decision. Every hit still has to be verified
// against the board's own stated name before it goes into sources.js.
//
// Usage:
//   node scripts/discover-ats.js                     # every unmonitored watch-list card
//   node scripts/discover-ats.js Chegg Pearson 2U    # just these

const path = require("path");
const vm = require("vm");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");

// The signatures worth finding, most specific first.
const PATTERNS = [
  { ats: "workday", re: /https?:\/\/([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com\/(?:[a-z-]+\/)?([A-Za-z0-9_-]+)/gi,
    read: (m) => ({ tenant: m[1], dc: m[2], site: m[3] }) },
  { ats: "greenhouse", re: /(?:boards|job-boards)\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9_-]+)/gi,
    read: (m) => ({ board: m[1] }) },
  { ats: "lever", re: /jobs\.lever\.co\/([a-z0-9_-]+)/gi, read: (m) => ({ board: m[1] }) },
  { ats: "ashby", re: /jobs\.ashbyhq\.com\/([a-z0-9_.-]+)/gi, read: (m) => ({ board: m[1] }) },
  { ats: "smartrecruiters", re: /(?:jobs|careers)\.smartrecruiters\.com\/([A-Za-z0-9_-]+)/gi, read: (m) => ({ board: m[1] }) },
  { ats: "icims", re: /([a-z0-9-]+)\.icims\.com/gi, read: (m) => ({ tenant: m[1] }) },
  { ats: "taleo", re: /([a-z0-9]+)\.taleo\.net/gi, read: (m) => ({ tenant: m[1] }) },
  { ats: "successfactors", re: /([a-z0-9]+)\.(?:jobs\.)?sap(?:sf)?\.com|careers\.([a-z0-9-]+)\.com\/.*successfactors/gi,
    read: (m) => ({ tenant: m[1] || m[2] }) },
  { ats: "usajobs", re: /usajobs\.gov/gi, read: () => ({}) },
  { ats: "florecruit", re: /florecruit\.com\/v2\/app\/([a-z0-9-]+)/gi, read: (m) => ({ board: m[1] }) },
  { ats: "phenom", re: /([a-z0-9-]+)\.phenompeople\.com/gi, read: (m) => ({ tenant: m[1] }) },
  { ats: "eightfold", re: /([a-z0-9-]+)\.eightfold\.ai/gi, read: (m) => ({ tenant: m[1] }) },
  { ats: "oracle", re: /([a-z0-9-]+)\.oraclecloud\.com/gi, read: (m) => ({ tenant: m[1] }) },
];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

async function get(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, url: res.url, html: await res.text() };
  } catch (error) {
    return { ok: false, error: error.name === "TimeoutError" ? "timeout" : error.message };
  }
}

function findAts(html) {
  const found = [];
  for (const { ats, re, read } of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html))) {
      const detail = read(m);
      const key = ats + JSON.stringify(detail);
      if (!found.some((f) => f.key === key)) found.push({ key, ats, ...detail });
      if (found.length > 6) break;
    }
  }
  return found;
}

// Where employers actually put the link. Ordered by how often it works.
function candidateUrls(domain) {
  return [
    `https://careers.${domain}`,
    `https://${domain}/careers`,
    `https://jobs.${domain}`,
    `https://${domain}/en/careers`,
    `https://${domain}/careers/students`,
    `https://${domain}/about/careers`,
  ];
}

async function discover(company, domain) {
  for (const url of candidateUrls(domain)) {
    const res = await get(url);
    if (!res.ok) continue;
    const hits = findAts(res.html);
    if (hits.length) return { company, domain, via: url, landed: res.url, hits };
  }
  return { company, domain, hits: [] };
}

(async () => {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "watchlist.js"), "utf8"), sandbox);
  const domains = sandbox.window.COMPANY_DOMAINS || {};
  const watchlist = sandbox.window.WATCHLIST || [];

  const only = process.argv.slice(2);
  const targets = (only.length ? watchlist.filter((w) => only.includes(w.company)) : watchlist)
    .filter((w) => domains[w.company])
    .map((w) => ({ company: w.company, field: w.field, domain: domains[w.company] }));

  console.log(`Discovering ATS for ${targets.length} employer(s)\n`);

  const results = [];
  // Small concurrency: polite to the sites, and fast enough for this list size.
  const queue = [...targets];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const t = queue.shift();
      const found = await discover(t.company, t.domain);
      results.push({ ...t, ...found });
      const label = found.hits.length
        ? found.hits.map((h) => `${h.ats}:${h.board || h.tenant || ""}${h.site ? `/${h.site}` : ""}`).join("  ")
        : "— nothing found";
      console.log(`${t.company.padEnd(28)} ${label}`);
    }
  }));

  const withHits = results.filter((r) => r.hits.length);
  console.log(`\n${withHits.length} of ${results.length} exposed an ATS.`);
  console.log("\nNEXT: none of these are confirmed. Verify each board's own stated name");
  console.log("before adding it — a resolving token is not proof of ownership.\n");
  fs.writeFileSync(path.join(ROOT, "_ats-discovery.json"), JSON.stringify(results, null, 2));
  console.log("Full detail written to _ats-discovery.json");
})();

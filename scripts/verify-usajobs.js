// One-off live verification for the USAJOBS adapter. Reads the key + email
// from .env.local (which is gitignored — the key never enters git or the repo
// history), runs the real aggregator, and prints what the gov feed returns so
// we can confirm the integration works before wiring it into Vercel.
//
//   1. Put these two lines in .env.local (repo root):
//        USAJOBS_API_KEY=your-key-here
//        USAJOBS_EMAIL=your-signup-email@example.com
//   2. Run:  node scripts/verify-usajobs.js

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (!process.env.USAJOBS_API_KEY || !process.env.USAJOBS_EMAIL) {
  console.error("Missing USAJOBS_API_KEY / USAJOBS_EMAIL in .env.local — see the header of this file.");
  process.exit(1);
}

const { aggregateOpenings } = require("../api/_shared/aggregator");

(async () => {
  const r = await aggregateOpenings();
  const gov = r.openings.filter((o) => o.field === "Government");
  const status = r.sourceStatus.find((s) => s.ats === "usajobs");
  console.log("USAJOBS source status:", JSON.stringify(status));
  console.log(`Government openings surfaced: ${gov.length}\n`);
  const byAgency = {};
  gov.forEach((o) => { byAgency[o.company] = (byAgency[o.company] || 0) + 1; });
  console.log("By agency:");
  Object.entries(byAgency).sort((a, b) => b[1] - a[1]).forEach(([a, n]) => console.log(`  ${a}: ${n}`));
  console.log("\nSamples:");
  gov.slice(0, 12).forEach((o) => console.log(`  [${o.cycle}] ${o.company} — ${o.role} (closes ${o.deadline})\n     ${o.sourceUrl}`));
})().catch((e) => { console.error("Verify failed:", e); process.exit(1); });

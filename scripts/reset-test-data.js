#!/usr/bin/env node
// Clear the data left over from testing, before real students arrive.
//
// Everything built before launch was exercised by three people, and those
// numbers will sit in the dashboard forever otherwise — a funnel whose first
// cohort is the founders is a funnel that lies about the product.
//
// DRY RUN BY DEFAULT. Nothing is deleted without --apply, because this talks
// to production Redis and several of these groups are not recoverable.
//
//   node scripts/reset-test-data.js                      # show what would go
//   node scripts/reset-test-data.js --apply              # safe groups only
//   node scripts/reset-test-data.js --accounts --apply   # also delete accounts
//
// Needs the Upstash credentials in the environment:
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/...
//
// NOT touched, deliberately:
//   promptly:openings:live   the feed itself — clearing it empties the app
//                            until the next hourly refresh
//   promptly:source*         source health history, which took weeks to build
//                            and says nothing about who used the app
//   promptly:slides:decks    marketing tooling, unrelated

// Read .env.local if it is there, so the credentials never have to be typed on
// a command line. Anything already in the environment wins, and the file is
// gitignored — pasting a production token into a shell puts it in your history,
// which is a worse place for it than a file you already keep secrets in.
function loadEnvLocal() {
  const fs = require("fs");
  const path = require("path");
  const file = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value && !process.env[match[1]]) process.env[match[1]] = value;
  }
}

const GROUPS = {
  analytics: {
    label: "Anonymous daily counters (app opens, signups, views)",
    patterns: ["promptly:a:*"],
    note: "These carry a 9-day TTL and clear themselves — included only to make the reset immediate.",
  },
  health: {
    label: "Health records (email, cron runs, privacy cleanup)",
    patterns: ["promptly:email:health", "promptly:run:*", "promptly:privacy:cleanup"],
    note: "Clearing email health returns the admin banner to amber until the next real send succeeds.",
  },
  reports: {
    label: "Student listing reports",
    patterns: ["promptly:report*"],
    note: "Includes the 'testing 123456' rows from August.",
  },
  queues: {
    label: "Pending digest queues",
    patterns: ["promptly:digest:*"],
    note: "Anything waiting to be sent as a digest is dropped. Nothing else is affected.",
  },
  alerted: {
    label: "The record of which listings have ALREADY been alerted",
    patterns: ["promptly:openings:alerted"],
    note: "DANGEROUS NEAR LAUNCH. notifySubscribers only queues listings it considers new. Clearing this makes every listing currently live — around a thousand — count as new on the next hourly refresh, and every one of them is queued to every subscriber. One student's first digest would be the entire feed. Only clear this if there are no subscribers left to alert.",
    optIn: true,
  },
  accounts: {
    label: "SUBSCRIBER ACCOUNTS, saved alerts, verify and unsubscribe tokens",
    patterns: ["promptly:subscriber:*", "promptly:subscribers", "promptly:verify*", "promptly:unsub:*"],
    note: "DESTRUCTIVE. Everyone signs up again. Supabase auth users are NOT touched — sign in and the record rebuilds itself.",
    optIn: true,
  },
};

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const withAccounts = args.includes("--accounts");

  loadEnvLocal();
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.error("Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in the environment.");
    console.error("Add them to .env.local in the repo root (it is gitignored), or pass them inline:");
    console.error("  UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npm run reset:test-data");
    console.error("Copy the values from Vercel → Settings → Environment Variables, or the Upstash console.");
    process.exit(1);
  }

  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url, token });

  let grandTotal = 0;
  for (const [name, group] of Object.entries(GROUPS)) {
    const optInFlag = name === "accounts" ? "--accounts" : `--${name}`;
    if (group.optIn && !args.includes(optInFlag)) {
      console.log(`\n  ${name}  SKIPPED — pass ${optInFlag} to include it`);
      console.log(`      ${group.label}`);
      continue;
    }

    const keys = [];
    for (const pattern of group.patterns) {
      if (!pattern.includes("*")) {
        if (await redis.exists(pattern)) keys.push(pattern);
        continue;
      }
      let cursor = 0;
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 300 });
        cursor = Number(Array.isArray(result) ? result[0] : result?.cursor) || 0;
        keys.push(...((Array.isArray(result) ? result[1] : result?.keys) || []));
      } while (cursor !== 0);
    }

    const unique = [...new Set(keys)];
    grandTotal += unique.length;
    console.log(`\n  ${name}  ${unique.length} key${unique.length === 1 ? "" : "s"}`);
    console.log(`      ${group.label}`);
    if (group.note) console.log(`      ${group.note}`);
    if (unique.length) console.log(`      e.g. ${unique.slice(0, 3).join(", ")}${unique.length > 3 ? " …" : ""}`);

    if (apply && unique.length) {
      // Batched: DEL with several thousand arguments fails on the REST API.
      for (let i = 0; i < unique.length; i += 200) await redis.del(...unique.slice(i, i + 200));
      console.log(`      DELETED`);
    }
  }

  console.log(`\n${apply ? "Deleted" : "Would delete"} ${grandTotal} key(s) in total.`);
  if (!apply) console.log("Dry run — nothing was changed. Re-run with --apply to do it.");
  if (apply && withAccounts) {
    console.log("\nAccounts are gone from Redis. Supabase auth users still exist:");
    console.log("everyone signs in again and their subscriber record rebuilds on first save.");
  }
}

main().catch((error) => {
  console.error("Reset failed:", error.message);
  process.exit(1);
});

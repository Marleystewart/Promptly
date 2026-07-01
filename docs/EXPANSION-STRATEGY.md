# Promptly Expansion Strategy

*Written July 2026. Grounded in the actual architecture: live ATS feeds
(`api/_shared/sources.js`) + honest watchlist placeholders (`watchlist.js`).
The no-fake-links rule is non-negotiable and shapes everything below.*

---

## 0. The one strategic constraint that drives everything

A company can appear in Promptly two ways:

| Mode | Requirement | Value to student |
|---|---|---|
| **Live feed** | Employer uses an ATS with a public JSON API | Real posting, real link, alertable |
| **Watchlist card** | None | "We're watching" — honest but passive |

So expansion priority is **not** "which companies are famous" — it's
**(student demand) × (internship volume) × (feed accessibility)**. A
Fortune 500 giant on a closed ATS (Taleo/iCIMS) is worth *less* to the
pipeline than a mid-size firm on Greenhouse.

**Adapter coverage today:** Greenhouse, Workday, Lever.
**Verified available (probed 2026-07):**
- **Ashby** — `https://api.ashbyhq.com/posting-api/job-board/{board}` (200 OK for openai, ramp, notion). Unlocks the entire top-startup tier.
- **SmartRecruiters** — `https://api.smartrecruiters.com/v1/companies/{company}/postings` (200 OK for Visa). Unlocks Visa, Bosch, IKEA-class enterprises.
- **USAJOBS** — `https://data.usajobs.gov/api/search` (free API key). Unlocks ALL federal internships (Pathways program) in one adapter.

**Recommendation: build these 3 adapters before adding a single new
watchlist name.** Two adapters ≈ +50 live-feedable companies; USAJOBS ≈
every federal agency at once.

---

## 1. Industry prioritization

### Keep the taxonomy stable
15 fields exist. Tabs are the UI's scarcest resource. Deepen existing
fields first; add at most **two** new ones.

### Tier 1 — deepen now (demand × volume × feedability all high)
| Industry | Hiring potential | Why now |
|---|---|---|
| **Technology** | Largest structured internship volume in the US; SWE/PM/data/design | Greenhouse/Lever/Ashby-dense; Ashby adapter unlocks the hottest startups students actually ask for (OpenAI, Ramp, Notion, Linear, Vercel-class) |
| **Finance** | Highest per-role competitiveness; earliest timelines (sophomore recruiting) | Already Promptly's strongest vertical; quant/HF/fintech are Greenhouse-dense. Bulge brackets stay watchlist (custom ATS) — that's fine, deadlines are the value there |
| **Healthcare & Biotech** | #1 US employment sector; pre-med/bio/chem/public-health majors underserved by trackers | Biotech is Greenhouse-dense (already: Ginkgo, Recursion, Flatiron, Oscar, Zocdoc, Komodo) — add 20+ more |
| **Engineering (Aero/Defense/Hardware)** | Massive demand, ITAR means US-citizen-friendly roles | SpaceX, Anduril, Relativity already live; sector is Greenhouse-heavy (defense-tech boom) |
| **Government** | Federal Pathways internships = tens of thousands of paid seats; deadline-driven like finance | One USAJOBS adapter = every agency (State, Treasury, NASA, NIH, DOE, FBI…). No competitor does this well |

### Tier 2 — expand once adapters land
- **Consulting** — MBB/Big 4 are closed-ATS watchlist cards (deadline alerts still valuable); mid-tier (Analysis Group, Cornerstone Research, ZS, Oliver Wyman) partially feedable.
- **Consumer/CPG & Retail** — P&G, PepsiCo, Nike, Target, Walmart: huge intern classes, mostly Workday (adapter exists — needs per-tenant config discovery).
- **Media & Entertainment** — Disney/NBCU/WBD are Workday; Spotify (Lever) already added; A24/indie via watchlist.
- **Marketing/Advertising** — holding companies (WPP, Omnicom, IPG) closed; direct-brand marketing internships come via the Consumer/Tech feeds anyway.

### Tier 3 — the two new fields worth adding
1. **Energy & Climate** — utilities + renewables + climate-tech. Strong demand signal from Gen Z, weak coverage everywhere. Climate startups are Greenhouse/Ashby-dense (Crusoe, Form Energy, Commonwealth Fusion, Arcadia). Add utilities (NextEra, Duke, Southern Co — Workday) as watchlist.
2. **Travel & Hospitality** — Marriott, Hilton, Delta, United, Disney Parks, cruise lines. Enormous entry-level volume, hospitality/business majors underserved. Mostly Workday/closed → watchlist-first, flip as feeds are found.

*(Sports and Real Estate already exist as fields — deepen with teams/leagues (mostly closed ATS → watchlist) and CBRE/JLL (Workday).)*

---

## 2. Company targets by industry

Names below are **candidates, not commitments**. Rule: every entry is
probed by script before it ships (`sources.js` needs a responding board;
watchlist entries need none). Never hand-type an ATS slug into prod
without a 200 + title-sanity check.

### Technology
- **Recognizable:** Google, Apple, Microsoft, Amazon, Meta, Netflix (closed/custom → watchlist); NVIDIA, Salesforce, Adobe, Intel, IBM, Oracle, Uber (Workday/custom — probe Workday tenants).
- **Live-feed targets (probe Greenhouse/Lever/Ashby):** OpenAI ✓(Ashby), Ramp ✓(Ashby), Notion ✓(Ashby), Linear, Retool, Vanta, Deel, Anduril ✓(live), Snowflake, Plaid, Chainlink, HashiCorp, Grammarly, Duolingo ✓(live), Hugging Face, Perplexity, Cursor/Anysphere.
- **Hidden gems:** Two Sigma-adjacent tech (Hudson River Trading — greenhouse `wehrtyou`), Cloudflare ✓, Datadog ✓ (both live already, promote in UI); MITRE, Aerospace Corp (nonprofit engineering, Workday).

### Finance
- **Recognizable (watchlist, deadline-driven):** Goldman, JPM, Morgan Stanley, BofA, Citi, Evercore, Centerview, Vista, KKR, Apollo ✓(all present).
- **Live-feed targets:** Citadel (custom — check), Two Sigma (greenhouse), HRT, Virtu, SIG (greenhouse `sig`?), Balyasny, ExodusPoint; fintech: Ramp ✓, Mercury, Adyen, Wise.
- **Hidden gems:** Federal Reserve Banks (NY Fed RA program — custom), FDIC/OCC/SEC scholar programs (→ USAJOBS adapter), state pension funds, Vanguard/Fidelity/T. Rowe (Workday, huge intern classes, low student awareness vs. IB).

### Healthcare & Biotech
- **Recognizable:** Pfizer, J&J, Merck, Eli Lilly, Moderna, UnitedHealth/Optum, CVS Health (Workday-family — probe tenants).
- **Live-feed targets:** Benchling, Tempus, Color, Devoted Health, Cityblock, Hinge Health, 10x Genomics, Insitro, Genentech (custom), Vertex (Workday).
- **Gov/nonprofit:** NIH, CDC, FDA (→ USAJOBS), St. Jude, Mayo/Cleveland Clinic (Workday).
- **Hidden gems:** contract research orgs (IQVIA, ICON) — massive hiring, zero campus brand.

### Engineering / Aerospace / Defense
- **Recognizable:** Lockheed, Northrop, RTX, Boeing, GE Aerospace (Workday tenants — high-value probe targets).
- **Live-feed targets:** SpaceX ✓, Anduril ✓, Relativity ✓, Zipline ✓; add Shield AI, Saronic, Hadrian, Varda, Firefly, Astranis (defense-tech is Greenhouse/Ashby-dense).
- **Gov/nonprofit:** NASA, national labs (Sandia, LLNL, PNNL, Oak Ridge — mix of USAJOBS and Workday), MITRE, JHU APL.

### Government (USAJOBS adapter = the whole tier)
Pathways Internship Program, State Dept, Treasury (OFAC/OCC), DOE, DOJ,
FBI Honors, NSA (custom), CIA (custom), GAO, CBO, Fed agencies. State/city:
NYC Urban Fellows, CA Capital Fellows (manual watchlist — low volume, high prestige).

### Consulting
- **Watchlist (closed ATS, deadline-driven):** McKinsey, BCG, Bain, Deloitte, PwC, EY, KPMG, Accenture ✓(mostly present).
- **Live-feed targets:** Analysis Group, Cornerstone Research (probe slugs), ZS Associates, Guidehouse (Workday), Kearney, LEK (probe).

### Consumer / Media / Marketing / Education / Nonprofit
- **Consumer:** P&G, PepsiCo, Unilever, Nike, Target, Sephora (Workday probes); live: Glossier ✓, Sweetgreen ✓, Warby Parker (probe), Liquid Death, Olipop (Greenhouse likely).
- **Media:** Disney, NBCU, WBD, NYT (Workday/custom → watchlist); live: Spotify ✓, Vox ✓, The Athletic ✓, Substack, Patreon (probe).
- **Education:** Khan Academy ✓, Duolingo ✓, Coursera ✓; add Teach for America (custom → watchlist), College Board, ETS (Workday).
- **Nonprofit:** Wikimedia ✓, Code for America ✓; add ACLU, RAND (greenhouse `rand`?), Brookings, Urban Institute, Gates Foundation (Workday).

### Energy & Climate (new field)
Live targets: Crusoe, Form Energy, Commonwealth Fusion (retry slug),
Arcadia, Palmetto, Base Power; watchlist: NextEra, GE Vernova, Duke,
Southern Co, Exxon/Chevron (huge, Workday/custom), Tesla (custom).

### Travel & Hospitality (new field)
Watchlist-first: Marriott, Hilton, Hyatt, Delta, United, American,
Southwest, Airbnb ✓(already live!), Expedia (Workday), Royal Caribbean,
Disney Parks. Airbnb being live already seeds the tab.

---

## 3. Scalable maintenance system (no manual rot)

### Principles
1. **The feed is the verification.** A listing exists ⇔ it's in the employer's own ATS feed today. Never verify by hand.
2. **Watchlist is the honest waiting room.** Cards without feeds say so. A company is never "in the database" with a stale link — links only come from feeds.
3. **Registry as code, probed in CI.** No CMS, no admin data entry.

### Concrete design
**Phase 1 (now → first campus):**
- Add `domain` to every source/watchlist entry (becomes the canonical company key + logo key).
- Add a **registry lint test** to `npm test`: no duplicate slugs/domains, valid `field` values, every `ats` has required keys.
- Promote the probe script (already written, `scratchpad/probe-sources.js`) into `scripts/probe-sources.js`; add `npm run probe`.
- **Nightly GitHub Action** (NOT a Vercel cron — Hobby's 2 cron slots are taken) runs the probe and **auto-opens a GitHub issue** when a source fails 3 consecutive nights or a board's job count drops to 0 and stays. Zero dashboard-watching.

**Phase 2 (growth):**
- **Adapters over entries:** Ashby, SmartRecruiters, USAJOBS. Each adapter is ~40 lines (mirror `fetchGreenhouse`) and unlocks dozens of employers.
- **"Request a company" button** in-app → POSTs to Redis queue → shows in admin dashboard. Students become your discovery engine; you probe + merge weekly. This is the only sustainable long-tail strategy.
- **Refresh sharding:** when sources pass ~150, split the refresh cron into batches (e.g. `?shard=0/1/2` processed round-robin by day-of-week or sequential invocations) so the function stays inside Vercel time limits. Store per-shard status.

**Phase 3 (scale, thousands of companies):**
- Move the openings payload from one Redis key to per-field keys with an index; paginate `/api/openings` by field (frontend already renders per-tab).
- Track per-source health history in Redis (`ok_streak`, `fail_streak`, `last_count`) and surface it in `/admin.html`.
- Only then consider closed-ATS scraping partnerships or aggregator APIs — never HTML scraping of career pages (breaks silently = fake-data risk).

### What NOT to do
- Don't chase "tens of thousands of companies" as a number. US students seriously recruit at ~2–3k employers. 500 accurate, alertable companies beats 20,000 stale rows — accuracy is the moat and the brand (the-trackr can't say that).
- Don't hand-maintain deadlines for closed-ATS firms beyond the curated top ~30 (bulge brackets, MBB) where deadlines ARE the product.

---

## 4. Logo strategy

### Legal reality (short version)
Using a company's logo **to identify that company's job listing** is
classic *nominative fair use* — the same basis every job board (LinkedIn,
Indeed, Handshake) operates on. Rules: use the unmodified mark, don't
imply endorsement, keep the existing footer-style disclaimer ("Promptly
is not affiliated with the employers listed"), and honor any takedown
request immediately. Do **not** copy logo files into marketing material
implying partnership.

### Options compared
| Approach | Quality | Effort | Risk/Cost |
|---|---|---|---|
| Official press kits, self-hosted | Best | High per-company (manual) | License terms vary; fine at top-100 scale |
| **Logo CDN keyed by domain (logo.dev / Brandfetch Logo Link)** | High, consistent | ~1 line: `https://img.logo.dev/{domain}?token=…` | Free tier w/ attribution; provider handles licensing posture; Clearbit's old free API is dead (redirects to Brandfetch) |
| Google favicon service (`google.com/s2/favicons?domain=X&sz=128`) | Low-res but 100% coverage | Zero | Free, reliable fallback |
| Wikipedia/Wikimedia SVGs | High | Manual, license per-file | Free |
| Current initials tiles | Consistent, already built | Zero | None |

### Recommendation (layered, minimal new code)
1. **Add `domain` to every company entry** — one field powers logos forever.
2. **Primary:** domain-keyed logo CDN (logo.dev free tier or Brandfetch Logo Link — register, pick one). The existing `onerror="logoFallback(this)"` handler means a miss degrades gracefully with **zero new failure modes**.
3. **Fallback chain (already 80% built):** CDN image → colored initials tile. Optionally insert Google favicon between them.
4. **Top ~50 brand-critical logos** (the ones on your landing/featured cards): keep curated files in `assets/logos/` as today — first-paint quality where it matters, no third-party dependency on the homepage.
5. **Consistency:** render every logo inside the existing fixed-size tile with padding + white/tinted background (already the pattern) so mixed sources still look uniform.
6. Add one line to the footer/about: "Company names and logos are trademarks of their respective owners, used to identify job listings. Promptly is not affiliated with or endorsed by these employers."

This gives every one of thousands of future companies a decent logo
automatically, with a paved upgrade path and a clean legal posture.

---

## 5. Sequenced roadmap

1. **Ashby + SmartRecruiters adapters** (unlocks ~50 top-demand employers incl. OpenAI, Ramp, Notion, Visa) — small, testable, highest ROI.
2. **USAJOBS adapter** (free key) + Government tab becomes genuinely alive — differentiator vs. the-trackr.
3. **`domain` field + logo CDN fallback** — visual polish across all ~300 cards in one change.
4. **Registry lint test + nightly GitHub Action probe** — the maintenance system.
5. **Batch-probe expansion:** +40 companies across Healthcare, Defense-tech, Fintech, Climate (script-verified).
6. **Two new fields:** Energy & Climate, Travel & Hospitality (seeded by Airbnb + climate startups from step 5).
7. **"Request a company" queue** — turn students into the discovery engine.
8. Refresh sharding + per-field openings storage when source count/user count demands it.

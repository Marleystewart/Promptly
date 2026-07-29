# Promptly — Pre-Launch Technical Audit

**Date:** 29 July 2026
**Scope:** Codebase and connected dev environment only. Paid services, legal work,
marketing, partnerships, and manual business tasks are listed separately and do
**not** affect the technical score.
**Changes made:** All Claude-actionable Critical/High/Medium fixes applied and
committed locally across three batches (`151bd4a`, `426d2ec`, `72990b4`).
**Nothing has been pushed or deployed** — that remains your call.

**Post-fix score: 80/100** (from 38). See §14 for what moved and what is left.

---

## 1. Executive verdict

**Is Promptly technically ready to launch? No — not for public launch.**
**Ready for:** private testing only (trusted users you personally know).

| | Score |
|---|---|
| **Current** | **38 / 100** |
| **Projected after Claude-actionable fixes** | **~80 / 100** |

The score is dominated by one architectural fact: **Supabase auth is parked
(`AUTH_ENABLED = false`), so there is no authentication on any write endpoint.**
Every API route that stores data or sends mail accepts anonymous requests. This
was a deliberate, documented decision — not sloppiness — but it has real
security consequences that the score has to reflect.

Score caps applied (from your rubric):
- *"No reliable user-data isolation: maximum 39"* — applies.
- *"Missing authorization on sensitive backend operations: maximum 49"* — applies.
- *"Any unresolved Critical: maximum 49"* — applies.

The lowest binding cap is **39**, and the category math lands at **38**.

**Worth saying plainly:** much of this codebase is genuinely well built. HTML
escaping is applied consistently and correctly, there are zero dependency
vulnerabilities, no secrets are committed, the test suite is real and passes,
and the product is unusually honest about its own data. The problems are
concentrated in the unauthenticated API surface, not spread through the app.

### Five biggest risks

1. **Anyone can create or overwrite another person's alert record** (`/api/subscribe`) — no auth, keyed only by email.
2. **Anyone can make Promptly send branded email to any address** (`/api/send-alert`, `/api/send-recap`) — spam vector against your own sending domain.
3. **SSRF via push endpoint** (`/api/send-test`) — the server POSTs to an attacker-supplied URL.
4. **Cron endpoints fail open** — if `CRON_SECRET` is unset, `/api/retention` (which mass-mails every subscriber) is publicly triggerable.
5. **No unsubscribe path exists anywhere** in code — no link, no header, no endpoint.

---

## 2. Architecture summary

| Layer | Implementation |
|---|---|
| **Frontend** | Vanilla HTML/CSS/JS PWA. No framework, no build step. `index.html` + `script.js` (~2.7k lines), `assistant.js` (scripted chatbot), `watchlist.js`, `monitored.js` (generated), `auth-routing.js`. |
| **Backend** | Vercel serverless functions in `api/` — **12 functions** (at the platform limit). CommonJS, no framework. |
| **Database** | Upstash Redis (REST). No SQL, no schema, no migrations, no ORM. Keys: `promptly:subscriber:<email>`, `promptly:openings:live`, `promptly:digest:<email>`, `promptly:watched-sources`, `promptly:coverage-requests`, `promptly:a:*` (analytics). |
| **Auth** | **Parked.** Supabase auth exists behind `AUTH_ENABLED = false` in `api/auth-config.js`. App falls back to an on-device profile in `localStorage`. Supabase SDK is lazy-loaded and currently never fetched. |
| **Hosting** | Vercel. `vercel.json` sets `cleanUrls`, one function `maxDuration: 300`, and two crons. **No `headers` block — zero security headers configured.** |
| **Storage buckets** | **None.** No S3/Supabase Storage. Résumé is pasted text kept in `localStorage`; profile photo is a data URL in `localStorage`. Neither leaves the device. |
| **Email** | Resend (`api/_shared/alerts.js`). Templates built as HTML strings with an `escapeHtml` helper. |
| **Push** | `web-push` with VAPID. Subscriptions stored on the subscriber record. |
| **Cron** | `/api/refresh-openings` hourly; `/api/retention` daily 14:00 UTC. |
| **Third-party integrations** | Employer ATS feeds (Greenhouse, Lever, Ashby, SmartRecruiters, Workday, USAJOBS); Resend; Upstash; **Google favicon service** (see F-07). |
| **Roles** | Two effective roles: anonymous student (everything) and admin (shared-secret only, `/api/admin-stats`). No per-user identity, no RBAC, no row-level security (no SQL DB). |
| **Public pages** | `/`, `/privacy`, `/terms`, `/how-it-works`, `/content/slides`, `/content/deck`. |
| **Private pages** | `/admin.html` — protected only by a shared secret typed into a form. |
| **Job ingestion** | `api/_shared/aggregator.js` pulls each source's public ATS API hourly, filters via `detectCycle()`, dedupes, caps 12/company, writes to Redis. |
| **Alert generation** | Refresh diffs current vs. previous run → new listings → `matchesOpening()` per subscriber → push immediately, email queued to a per-user digest flushed by the daily cron. |
| **Link generation** | `sourceUrl` comes straight from each employer feed. Validated to `https:` for **email and push** (`safeOfficialUrl`) but **not** for the in-app modal link (F-08). |

---

## 3. Scorecard

| Category | Earned | Max | Reasoning |
|---|---|---|---|
| Security & privacy | 7 | 30 | No auth on write endpoints; SSRF; no security headers; third-party logo leak undisclosed. Offsets: no secrets committed, no vulnerable deps, excellent output escaping. |
| Backend reliability & data integrity | 12 | 20 | Solid dedupe, digest-claim idempotency, graceful degradation everywhere. Losses: fail-open crons, unauthenticated writes corrupting records, 37 broken logo refs. |
| Core product functionality | 16 | 20 | Flows work end to end and were driven manually. Losses: no unsubscribe, missing logos. |
| Authentication & permissions | 1 | 10 | Auth deliberately disabled. Admin is a shared secret with no lockout. No user isolation. |
| Link & navigation accuracy | 4 | 5 | All internal routes resolve; sample of external links well-formed. Minor `href="#"` placeholders. |
| Error handling & monitoring code | 4 | 5 | Consistently graceful, student-safe error copy; try/catch throughout. No structured logging or alerting. |
| Performance & scalability | 3 | 5 | Hourly cron fits in 300s today. `listSubscribers()` fans out one Redis GET per subscriber — will not scale. No pagination. |
| Accessibility & responsive design | 3 | 5 | Verified no horizontal overflow at 375px; aria-labels on icon buttons. Not audited with a screen reader; contrast unverified. |
| **Total** | **50** | **100** | **Capped to 38** by the unresolved Critical + no-isolation caps. |

---

## 4. Critical and High findings

### F-01 — Unauthenticated create/overwrite of any user's alert record
**Severity: Critical · Confidence: Confirmed (code read)**
**File:** `api/subscribe.js` (POST branch), `api/_shared/store.js` → `saveSubscriber()`

`POST /api/subscribe` validates only that `profile.email` is well-formed, then
writes to `promptly:subscriber:<email>`, merging over whatever is there.

**Impact:** anyone who knows a student's email can (a) enrol them in alerts they
never asked for, (b) overwrite their name, school, fields and notification
preferences, or (c) replace their stored `pushSubscription`, silently breaking
their alerts. Records are keyed purely by email with no proof of ownership.

**Safe reproduction:** read-only. `api/subscribe.js:47-75` — the POST path has
no `Authorization` check and no ownership proof.

**Fix:** require a verified-email token before a subscriber record becomes
active. Flow: POST creates a *pending* record + emails a signed token (Resend is
already wired); only a token callback promotes it to active. Blocks unsolicited
enrolment and overwrites.
**Claude can fix:** yes · **Complexity:** medium · **Blocks launch:** yes

---

### F-02 — Unauthenticated email sending to arbitrary addresses
**Severity: High · Confidence: Confirmed (code read)**
**Files:** `api/send-alert.js`, `api/send-recap.js`

Both accept anonymous POSTs and send fully branded Promptly email to any address
supplied in the body. Rate limiting (`takeTestAlertSlot`) is 60s per *email
address* and 10s per *requester*, where requester is the raw
`x-forwarded-for` header value.

**Impact:** Promptly's Resend sending domain can be used to deliver unsolicited
mail. Rotating the target address defeats the per-email limit entirely; the
per-requester limit still permits ~6/min per apparent IP. The realistic damage
is domain reputation and blocklisting — which would break alert delivery for
real students.

**Fix:** require the F-01 verification token to send to an address; take the
client IP from Vercel's trusted value rather than the raw header; add a global
per-hour ceiling.
**Claude can fix:** yes · **Complexity:** medium · **Blocks launch:** yes

---

### F-03 — Server-side request forgery via push subscription endpoint
**Severity: High · Confidence: Confirmed (code read)**
**File:** `api/send-test.js:36-50`

`body.subscription` is passed straight to `webpush.sendNotification()`, which
issues a POST to `subscription.endpoint` — a URL fully controlled by the caller.
No allowlist of push services.

**Impact:** an anonymous caller can make your serverless function issue POST
requests to arbitrary hosts, including internal or metadata addresses, with your
infrastructure as the origin.

**Fix:** validate `endpoint` is `https:` and its host matches a known push
service (`*.push.services.mozilla.com`, `*.googleapis.com`, `*.notify.windows.com`,
`*.push.apple.com`) before sending. Apply the same guard in `alerts.js`.
**Claude can fix:** yes · **Complexity:** low · **Blocks launch:** yes

---

### F-04 — Cron endpoints fail open when the secret is unset
**Severity: High · Confidence: Confirmed (code read); prod env value unverifiable
**Files:** `api/refresh-openings.js:52-57`, `api/retention.js:33-38`

```js
const secret = process.env.CRON_SECRET;
if (secret && !isVercelCron && provided !== secret) return 401;
```

If `CRON_SECRET` is **not set**, the guard is skipped entirely and both endpoints
are public. `/api/retention` iterates every subscriber and sends email.

**Impact:** an unauthenticated caller could repeatedly trigger a mass mailing to
your entire subscriber list, and force expensive full refreshes.

I **cannot verify** whether `CRON_SECRET` is set in your Vercel project — that is
a dashboard value. Regardless, the *code* should fail closed.

**Fix:** invert to fail closed — refuse the request when no secret is configured.
**Claude can fix:** yes · **Complexity:** low · **Blocks launch:** yes

---

### F-05 — Hardcoded fallback credential in source
**Severity: High · Confidence: Confirmed**
**File:** `api/slides.js:8` — `process.env.SLIDES_EDIT_KEY || "promptly2027"`

A working credential is committed in plaintext. Anyone reading the repo can
overwrite the shared slide decks in Redis.

**Fix:** remove the fallback; return 503 when the env var is absent.
**Claude can fix:** yes · **Complexity:** low · **Blocks launch:** no (internal tool)

---

### F-06 — No security headers configured
**Severity: High · Confidence: Confirmed**
**File:** `vercel.json` — no `headers` block

Missing: CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`. The app is therefore framable
(clickjacking), and has no defence-in-depth against injected script.

**Note:** a strict CSP requires handling the inline `onerror="logoFallback(this)"`
in `script.js:810` and inline `<style>`/`<script>` blocks in the HTML pages.

**Fix:** add a `headers` block; move the inline handler to a delegated listener.
**Claude can fix:** yes · **Complexity:** medium · **Blocks launch:** no, but needed before public launch

---

## 5. Medium and Low findings

### F-07 — Company logos leak browsing activity to Google (Medium)
**File:** `script.js:768-780`, `logoServiceUrl()`

Logos fall back to `https://www.google.com/s2/favicons?domain=<company>`. Every
such load tells Google which employer a student is looking at, with their IP and
referrer.

**This also makes the privacy page inaccurate** — `/privacy` lists processors as
Vercel, Upstash, Resend and push services, and does not mention Google.

**Correction to something I told you earlier:** after removing the Supabase CDN
script I said the app makes "zero third-party requests." That was wrong. I had
verified only `<script src>` tags, not images. This favicon fallback is a
third-party request and has been there all along.

**Fix:** self-host the remaining logos (removing the request entirely) or
disclose Google on the privacy page. Self-hosting is preferable and also fixes F-09.

### F-08 — External `sourceUrl` reaches an `href` unvalidated (Medium)
**File:** `script.js:1239` — `sourceLink.href = item.sourceUrl || "#"`

Email and push paths validate `https:` via `safeOfficialUrl()`; the in-app modal
does not. A non-`https` scheme from a compromised or hostile feed would become a
clickable link. Low likelihood, trivial to close.

### F-09 — 37 referenced logo files do not exist (Medium, data integrity)
201 watchlist entries reference `assets/logos/*.png`; **37 of those files are
missing** (e.g. `oppfi.png`, `factset.png`, `fiserv.png`, `tpg.png`). Each
produces a failed image request, a fallback flash, and an extra Google request.

### F-10 — No unsubscribe mechanism anywhere (Medium)
**Confirmed:** no unsubscribe link, no `List-Unsubscribe` header, no endpoint.
Turning off email requires opening the app on the original device. For a product
whose core action is sending email, this is a real gap (and the thing mailbox
providers look for).

### F-11 — Admin auth has no lockout or rate limiting (Medium)
`api/admin-stats.js` compares with `crypto.timingSafeEqual` (good) but has no
attempt limiting, so the shared secret is brute-forceable at request rate. The
length check before comparison also leaks secret length.

### F-12 — Unauthenticated analytics/outcome writes (Low–Medium)
`api/stats.js` POST accepts anonymous events and outcome records (school +
company + stage). Anyone can pollute the founder dashboard and the "peer pulse."
Data is aggregate and non-identifying, so impact is integrity, not privacy.

### F-13 — `listSubscribers()` will not scale (Low today)
`api/_shared/store.js` does one Redis GET per subscriber on every cron run. Fine
at current volume; becomes the bottleneck in the low thousands.

### F-14 — Minor placeholder links (Low)
`index.html:110` brand link is `href="#"`; `index.html:491` modal source link
ships as `href="#"` before JS populates it. Neither is user-visible as broken.

---

## 6. Link inventory

| Link / button | Location | Destination | Type | Status | Severity | Fix | Fixed? |
|---|---|---|---|---|---|---|---|
| Privacy | trust card, legal footers | `/privacy` | internal | Working | — | — | n/a |
| Terms | trust card, legal footers | `/terms` | internal | Working | — | — | n/a |
| How Promptly works | sidebar, trust card, chatbot | `/how-it-works` | internal | Working | — | — | n/a |
| Back to Promptly | legal pages | `/` | internal | Working | — | — | n/a |
| Support email | legal pages, chatbot | `mailto:help.promptly@gmail.com` | external | Working (well-formed) | — | — | n/a |
| Brand logo | `index.html:110` | `href="#"` | internal | Placeholder (JS-handled) | Low | Use `/` | No |
| Modal source link | `index.html:491` | `href="#"` → JS-set | internal→external | Works; **unvalidated scheme** | Medium | Validate `https:` (F-08) | No |
| Job "Open Official Posting" | opening modal | employer ATS URL | external | Unverified (not crawled) | Medium | Scheme validation | No |
| Curated fallback job links | `script.js` baseline | Apple/Google/Amazon/GS/etc. careers | external | Well-formed; **not verified live** | Low | Periodic link check | No |
| Company logo CDN | all cards | `google.com/s2/favicons` | external | Working; **privacy leak** | Medium | Self-host (F-07) | No |
| Supabase SDK | lazy-loaded only when auth on | `cdn.jsdelivr.net` | external | Not currently loaded | Low | Pin SRI if re-enabled | No |
| 37 logo files | watchlist cards | `assets/logos/*.png` | internal | **Broken (404)** | Medium | Add files or drop refs (F-09) | No |

**No fake, deceptive, or unrelated-destination links were found.** No hardcoded
`localhost`, no developer-only URLs, no tokens or private IDs in URLs.

---

## 7. Backend findings

- **No authentication on any write path** (F-01, F-02, F-12) — the central issue.
- **Fail-open cron authorization** (F-04).
- **SSRF** (F-03).
- **No pagination** on `/api/openings`; returns the entire feed each call. Cached 600s, acceptable now.
- **Idempotency is handled well** — `claimOnce()` prevents double digests; `filterNeverAlerted()` prevents re-alerting when a feed blips. Genuinely good design.
- **Graceful degradation is consistent** — every Redis/network failure path returns a safe default rather than throwing.
- **No sensitive data in logs** — verified: no `console.log` of emails or tokens in `api/`.
- **No SQL/NoSQL injection surface** — Redis keys are built from validated/normalized values; no query language in use.
- **No webhooks**, so no signature-verification gap.
- **CORS** is left at same-origin default (no `Access-Control-Allow-*` anywhere) — correct.

---

## 8. Security findings by area

**Authentication** — Disabled by design. No password policy, sessions, or cookies in play (nothing to misconfigure). Supabase code path is dormant and lazy-loaded. Account deletion (`api/subscribe.js` DELETE) *does* correctly verify a bearer token against Supabase before deleting — that code is sound.

**Authorization** — Effectively absent for student data (F-01). Admin is a single shared secret (F-11). No RBAC, no row-level security (no SQL database exists — Supabase RLS audit is **not applicable** in the current architecture).

**Database** — Redis; no schema/migrations/constraints. Records keyed by email. No RLS concept. Weak point is that ownership is asserted, never proven.

**Storage** — **No buckets.** Résumé text and profile photo never leave the device (verified: `accountProfile()` in `script.js` excludes `resumeText` and `photoDataUrl`). This eliminates the entire file-upload attack class — no MIME/extension/size/traversal/malware surface exists.

**API security** — No auth, weak rate limits, no request-size limits, no pagination.

**Input validation** — Email format validated; text fields length-capped and newline-stripped in `send-alert.js`; watch URLs strictly parsed and host-allowlisted to known ATS providers in `api/_shared/watch.js` (**this is well done** — it is the one place untrusted URLs are handled rigorously).

**File uploads** — Not applicable.

**Secrets** — **Clean.** `.env` and `.env.local` are gitignored and untracked; git history contains no secret files; `.env.example` holds placeholders (its `VAPID_PUBLIC_KEY` is a public key by design). One hardcoded fallback credential (F-05). No secrets in frontend bundles.

**Dependencies** — `npm audit`: **0 vulnerabilities**. Only 3 direct deps, all current, all reputable. Lockfile present and consistent.

**Browser security** — No security headers (F-06). No source maps shipped. Errors are user-safe and do not leak stack traces.

**Privacy** — Data collected is proportionate and documented. Résumé/photo genuinely stay local. Analytics are first-party and non-identifying. **Gap:** the Google favicon leak is undisclosed (F-07).

**Abuse protection** — Weak. Trivially bypassable rate limits, no bot protection, no account-creation throttle, no request-size caps.

**Logging** — Minimal. No structured logs, no error aggregation, no audit log of admin access. Nothing sensitive is logged.

---

## 9. User-flow results

| Flow | Result | Notes |
|---|---|---|
| Onboarding (3 steps, validation) | **Pass** | Drove manually; invalid email and empty required fields both blocked with clear messages that clear on typing. |
| Auth-parked fallback | **Pass** | Password/Google/tabs correctly hidden; honest status message. |
| Sign-up / login / password reset / OAuth | **Not testable** | Auth deliberately disabled. |
| Session persistence | **Pass** | Profile restored from `localStorage` across reloads. |
| Job feed, search, filters, empty states | **Pass** | Nonsense query shows a real empty state. All six views render. |
| Save / unsave, saved empty state | **Pass** | Verified round-trip through `localStorage`. |
| Job detail modal + source link | **Partial pass** | Opens/closes correctly with a real https link; scheme unvalidated (F-08). |
| Watch a company | **Partial pass** | UI + validation verified; server round-trip not exercised against prod (would write real data). |
| Alerts / email / push delivery | **Not testable** | Would send real messages — out of scope per your rules. Logic reviewed by reading only. |
| Unsubscribe | **Fail** | Does not exist (F-10). |
| Account deletion | **Not testable** | Requires a live Supabase session; code path reviewed and looks correct. |
| Admin dashboard | **Partial pass** | Auth logic sound; no lockout (F-11). Not exercised against prod. |
| Mobile responsiveness | **Pass** | 375px: zero horizontal overflow; wide elements confined to an intentional `overflow-x:auto` carousel. |
| Error recovery | **Pass** | API failures degrade with student-safe copy and re-enable their controls. |
| Console errors | **Pass** | Zero across all pages driven. |

---

## 10. Commands actually run

| Command | Result | Affects readiness? |
|---|---|---|
| `npm test` (7 suites) | **PASS**, exit 0 | Yes — positive |
| `npm audit --omit=dev` | **0 vulnerabilities** | Yes — positive |
| `npm ls --depth=0` | 3 deps, lockfile consistent | No |
| `git ls-files \| grep env` | only `.env.example` tracked | Yes — positive |
| `git log --diff-filter=A` secret scan | no secret files ever committed | Yes — positive |
| `grep` env-var inventory | 19 vars, all server-side | No |
| Manual browser drive (onboarding, 6 views, search, save, modal, watch, mobile) | See §9 | Yes |
| Logo file existence check | **37 missing** | Yes — negative |
| Link/route extraction | See §6 | Yes |

**Not run, and why:** no build (static, no build step); no typecheck (plain JS, no TS); no linter (none configured); no e2e framework (none present); no live API calls against production (would write real data / send real mail).

---

## 11. Claude-actionable fix plan

### Fix before any beta (Critical/High blockers)
| # | Change | Files | Risk | Score | Test |
|---|---|---|---|---|---|
| 1 | Email-verification token before a subscriber record activates | `api/subscribe.js`, `api/_shared/store.js`, new token helper | **Medium** | +18 | New unit tests + manual flow |
| 2 | Require verified email for send endpoints; trusted client IP; global ceiling | `api/send-alert.js`, `api/send-recap.js`, `store.js` | **Medium** | +8 | Unit tests |
| 3 | Allowlist push endpoint hosts (SSRF) | `api/send-test.js`, `api/_shared/alerts.js` | **Low** | +6 | Unit test |
| 4 | Make cron auth fail closed | `api/refresh-openings.js`, `api/retention.js` | **Low** | +5 | Unit test |
| 5 | Remove hardcoded slides key | `api/slides.js` | **Low** | +3 | Manual |

### Fix before public launch
| # | Change | Files | Risk | Score | Test |
|---|---|---|---|---|---|
| 6 | Security headers (CSP/HSTS/frame/nosniff/referrer/permissions) + remove inline `onerror` | `vercel.json`, `script.js` | **Medium** | +6 | Browser verify |
| 7 | Unsubscribe token endpoint + link + `List-Unsubscribe` header | `api/_shared/alerts.js`, one API route | **Medium** | +5 | Unit + manual |
| 8 | Self-host remaining logos; drop Google favicon fallback; update `/privacy` | `script.js`, `assets/logos/`, `privacy.html` | **Low** | +4 | Visual |
| 9 | Fix 37 missing logo references | `watchlist.js` or `assets/logos/` | **Low** | +2 | Existence test |
| 10 | Validate `sourceUrl` scheme before `href` | `script.js` | **Low** | +2 | Unit test |
| 11 | Admin attempt throttle + constant-time compare without length leak | `api/admin-stats.js` | **Low** | +2 | Unit test |

### Fix after launch
12. Pagination on `/api/openings` (Low) · 13. Replace per-subscriber Redis fan-out (Low) · 14. Structured logging + admin audit log (Low) · 15. Automated external link checker in CI (Low) · 16. Accessibility pass with a real screen reader (Low).

---

## 12. Non-code items (excluded from the score)

- Verify sending domain in Resend (paid/dashboard) — required before real students get email.
- Add `USAJOBS_API_KEY` / `USAJOBS_EMAIL` to Vercel env.
- Test push on a physical iPhone.
- Recover the Supabase account and re-enable auth — **this is the single highest-leverage non-code item**, since it removes the root cause of F-01/F-02.
- Confirm `CRON_SECRET` and `ADMIN_SECRET` are actually set in Vercel (I cannot see them).
- Legal review of privacy/terms by an attorney.
- Landing page (`joinpromptly.co`) is a separate repo and was not audited.

---

## 13. Final recommendation

> **Ready for private testing only.**

**Evidence:** the product's user-facing flows are genuinely solid — onboarding
validation, all six views, search, save, modal, mobile layout and error recovery
were driven manually and passed, with zero console errors, zero dependency
vulnerabilities, and no committed secrets. Output escaping is applied correctly
and consistently, and the watch-URL handler is rigorous.

But **there is no authentication on any endpoint that writes data or sends
mail.** Anyone who knows a student's email address can enrol them, overwrite
their record, or cause mail to be sent from your domain; the push endpoint will
POST to an arbitrary URL; and the mass-mailing cron is publicly triggerable if
one env var is unset. Those are not theoretical — they are direct reads of the
request handlers.

Give it to people you know and trust while items 1–5 are implemented. With those
five done, Promptly moves to **limited beta**; with 6–11 as well, and Supabase
auth restored, **controlled public launch** is realistic.


---

## 14. Post-fix status (29 July 2026)

| Finding | Severity | Status |
|---|---|---|
| F-01 Unauthenticated record create/overwrite | Critical | **Fixed** — records are dormant until an emailed token is redeemed; `verified` is settable only by that path |
| F-02 Unauthenticated email to any address | High | **Fixed** — every send path requires `verified === true` |
| F-03 SSRF via push endpoint | High | **Fixed** — vendor host allowlist at three layers |
| F-04 Crons fail open | High | **Fixed** — both refuse to run without `CRON_SECRET` |
| F-05 Hardcoded credential | High | **Fixed** — removed; constant-time compare |
| F-06 No security headers | High | **Fixed** — CSP, HSTS, frame denial, nosniff, referrer, permissions, COOP |
| F-07 Google favicon leak | Medium | **Fixed** — self-hosted only; zero external requests, verified |
| F-08 Unvalidated `sourceUrl` in href | Medium | **Fixed** — https-only |
| F-09 37 missing logo files | Medium | **Fixed** — dead references removed |
| F-10 No unsubscribe | Medium | **Fixed** — one-click link + `List-Unsubscribe` headers |
| F-11 Admin brute force / length leak | Medium | **Fixed** — 10/min throttle, hashed constant-time compare |
| F-12 Unauthenticated analytics writes | Low–Med | **Open** — aggregate only, integrity not privacy |
| F-13 `listSubscribers()` fan-out | Low | **Open** — fine at current scale |
| F-14 Placeholder `href="#"` | Low | **Open** — cosmetic |

### Category movement

| Category | Before | After | Max |
|---|---|---|---|
| Security & privacy | 7 | 24 | 30 |
| Backend reliability & data integrity | 12 | 17 | 20 |
| Core product functionality | 16 | 18 | 20 |
| Authentication & permissions | 1 | 6 | 10 |
| Link & navigation accuracy | 4 | 5 | 5 |
| Error handling & monitoring | 4 | 4 | 5 |
| Performance & scalability | 3 | 3 | 5 |
| Accessibility & responsive design | 3 | 3 | 5 |
| **Total** | **38** | **80** | **100** |

No score caps now apply: no unresolved Critical, no unresolved High touching
user data or auth, no broken core journey, no exposed secret, and user data is
isolated behind proof of email ownership.

### What the remaining 20 points require

- **+6 auth/permissions** — real per-user accounts. Needs the Supabase account
  recovered; email verification is a floor, not a replacement for sign-in.
- **+6 security & privacy** — tighten CSP to drop `'unsafe-inline'` (requires
  extracting inline scripts/styles to files), and add an admin audit log.
- **+3 backend** — pagination, replace the per-subscriber Redis fan-out.
- **+2 performance**, **+2 accessibility** (real screen-reader pass), **+1 monitoring**.

### Deployment note

`CRON_SECRET` is now **required**. Both crons return 503 without it, by design.
Confirm it is set in Vercel before the next deploy, or hourly refresh and the
daily digest will stop. Existing subscriber records count as unconfirmed and
will receive one confirmation email on their next profile save.

# App Store submission pack — Promptly | Internship Alerts

Written 14 Sep 2026, from what the code actually does. Every App Privacy answer
below is traceable to a file in this repo, because a nutrition label that
overstates or understates collection is a misrepresentation, not a typo.

**Not legal advice.** Age/minors law moves fast — see docs/MINORS-AND-AGE.md.

---

## 1. App Privacy (the highest-risk section)

Answer "Yes, we collect data", then declare exactly these.

### Contact Info
| Data | Collected | Linked to identity | Purpose | Tracking |
|---|---|---|---|---|
| Email Address | Yes | Yes | App Functionality | No |
| Name | Yes | Yes | App Functionality | No |

Source: `api/_shared/store.js` — `email`, `name` on the subscriber record.
Email is the account key and the address alerts are sent to. Name is only used
to greet the student in emails.

### Identifiers
| Data | Collected | Linked | Purpose | Tracking |
|---|---|---|---|---|
| User ID | Yes | Yes | App Functionality | No |
| Device ID | Yes | Yes | App Functionality | No |

Source: Supabase user id (`api/_shared/auth-user.js`); `deviceToken` /
`pushSubscription` in `store.js` — the APNs/web-push token, used only to deliver
the alert the student asked for.

### Other Data
| Data | Collected | Linked | Purpose | Tracking |
|---|---|---|---|---|
| Other Data | Yes | Yes | App Functionality | No |

Source: `school`, `gradYearBand`, `major`, `interests`, `fields` in `store.js`.
These exist solely to match a student to relevant internships. Note we store a
graduation-year BAND, not an exact year.

### Usage Data
| Data | Collected | Linked | Purpose | Tracking |
|---|---|---|---|---|
| Product Interaction | Yes | **No** | Analytics | No |

Source: `api/stats.js` — explicitly "identifier-free event tracking", rate
limited per IP, no email or user id attached. Declare as NOT linked.

### Do NOT declare (we genuinely do not collect these)
- **Résumé / User Content** — the upload feature was REMOVED. `script.js`
  deletes any legacy `resumeText` from local storage on load, and "resume"
  appears nowhere under `api/`. Verify with: `grep -rn resume api/`
- **Location** — no geolocation API use. `geo.js` is a static city table used to
  match a typed preference; it never reads device location.
- **Payments / Purchases** — the app is free and takes no payment.
- **Contacts, Photos, Health, Browsing History, Search History.**

### Tracking question
Answer **"No"** to "Do you or your third-party partners use data for tracking?"
We serve no ads, share nothing with data brokers, and do no cross-app tracking.
Privacy page states plainly: "We never sell your data."

---

## 2. App Review Information (this is what gets you rejected if missed)

**Sign-in required: YES.** `AUTH_ENABLED = true` in `api/auth-config.js`, so a
reviewer hits an account wall immediately. You MUST provide a working demo
account or review will fail.

- Create a real account with a confirmed email and put the credentials in
  "Demo Account". Confirm the email BEFORE submitting — unconfirmed profiles are
  deleted after 14 days and alerts stay off until confirmation.
- Notes to reviewer (paste something like this):

> Promptly alerts students when internships open. Sign in with the demo account
> provided. Open "Openings" to see live postings read from employers' own job
> systems; every listing links to the employer's official posting — we never
> host or accept applications ourselves. "Alerts" turns on email/push
> notifications. Account deletion is in Profile → Settings → Delete My Data,
> which erases the account and all alert data (Guideline 5.1.1(v)).

**Account deletion (5.1.1(v)) is implemented** — `deleteAccount` in
`api/subscribe.js` removes the Supabase auth user and erases the subscriber
record, tokens, queued digests and watch entries (`api/_shared/erase.js`).
Point the reviewer at it explicitly; it is a common rejection reason.

---

## 3. Age rating

- The app has no objectionable content; expect **4+** on the questionnaire.
- BUT `docs/MINORS-AND-AGE.md` flags that Promptly stated **no minimum age**,
  and notes a reviewer is among the first to notice. Set a minimum age in the
  Terms and the privacy page BEFORE submitting, and keep the rating consistent
  with it. If you set 13+, do not then claim 4+ without thinking it through.

---

## 4. Listing copy (drafts — edit freely)

**Name (30 max):** `Promptly: Internship Alerts`
**Subtitle (30 max):** `Apply first. Never miss one.`

**Promotional text (170 max, changeable without review):**
> New: Bank of America, UBS, Barclays, Jefferies and Evercore 2027 programs are
> live. Get alerted the moment a matching internship opens.

**Keywords (100 chars, comma separated, no spaces):**
`internship,intern,summer analyst,finance,career,jobs,student,college,recruiting,alerts,banking,swe`

**Description:**
> Promptly tells you the moment an internship opens — so you apply first.
>
> Applications close fast, and the students who get interviews are usually the
> ones who applied early. Promptly watches employers' own hiring systems and
> alerts you the second a role that matches your year, major and interests goes
> live.
>
> HOW IT WORKS
> • Set your school, graduation year and field once.
> • Promptly watches hundreds of employers' job systems continuously.
> • You get an alert the moment a matching internship opens.
> • Tap through and apply on the employer's official site.
>
> REAL LISTINGS, NOT SCRAPED GUESSES
> Every opening comes from the employer's own job feed, and a listing only stays
> up while it is still live there. When a role is pulled, it disappears here too.
> Where a company publishes no readable feed, we say so plainly instead of
> promising an alert we cannot deliver.
>
> BUILT FOR STUDENTS
> • Free. Always.
> • We never apply on your behalf and never post anything as you.
> • We never sell your data.
> • Delete your account and alert data any time, from inside the app.
>
> Coverage spans investment banking, sales & trading, quant, asset and wealth
> management, consulting, technology, engineering, healthcare and more.

**Support URL:** https://promptly-ctm.vercel.app/how-it-works
**Privacy Policy URL:** https://promptly-ctm.vercel.app/privacy
(Both must be reachable and must match what the app actually does.)

---

## 5. Screenshots — the current hard blocker

App Store Connect showed **iPhone 6.5" with nothing uploaded**. Required:
- **6.5" display** — 1284 x 2778 or 1242 x 2688 px, portrait.
- 3 to 10 images. Only the first 3 appear on the install sheet, so lead with
  the strongest.

Suggested order: (1) the alert/openings feed with real listings, (2) Student
Cycles showing when firms post, (3) profile/alert setup.

Capture from a real device or Simulator at exactly that size. Do not upload
marketing mockups with device frames drawn on — Apple wants actual screens.

---

## 6. Pre-submission checklist

- [ ] Screenshots uploaded (6.5")
- [ ] Description, keywords, subtitle, promo text
- [ ] Support + Privacy URLs live
- [ ] App Privacy answers entered per section 1
- [ ] Demo account created, email CONFIRMED, credentials in App Review Info
- [ ] Review notes mention where account deletion lives
- [ ] Age rating questionnaire done, minimum age consistent with Terms
- [ ] Build selected from TestFlight
- [ ] Category set (Education, or Business as secondary)
- [ ] Price: Free

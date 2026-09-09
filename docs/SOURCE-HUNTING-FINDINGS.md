# Source hunting: what has already been tried

> **Before you start:** read the ground rules in
> [`docs/GROUND-RULES.md`](GROUND-RULES.md). The cache-bust rule in particular
> changed on 3 Sep — bump on `main` after merging, never on your branch.


Checked 2 September 2026. Recorded so nobody spends an afternoon rediscovering
the same dead ends.

Run `node scripts/discover-ats.js "Company Name"` before hand-searching. It
fetches the employer's own careers pages and reads the ATS URL out of the
markup, which is the method that works — guessing board tokens does not, and
[a resolving token is not proof of ownership](#verification-is-not-optional).

## Confirmed and added

| Company | Source | Evidence |
|---|---|---|
| Doctors Without Borders | `greenhouse:msfcareers` | `/v1/boards/msfcareers` returns **"Medecins Sans Frontieres (Doctors Without Borders) - United States"**. One live student role, US-only, no leakage. |
| Sixth Street | `workday sixthstreet/sixthstreetcareers` | Left Greenhouse; board is a Workday iframe on `/current-opportunities/`. |
| Bread Financial, GSK, Genentech, Humana, NBA | Phenom | Each on the employer's own domain, CNAMEd to their own `phenompeople` tenant. |
| Qualcomm, Ford, Mayo Clinic | Eightfold | Same — own domain, own `eightfold.ai` tenant. |
| EY, ExxonMobil | SAP SuccessFactors (`jobs2web`) | Server-rendered and readable from plain Node — no browser needed. |
| Coca-Cola, Cleveland Clinic | Findly | JSON API on m-cloud.io, found by watching the rendered page's own requests. |

### Two platform gotchas worth knowing

**Eightfold serves two APIs.** `/api/apply/v2/jobs` (what Millennium's custom
microsite uses) returns **403** on a branded tenant. `/api/pcsx/search` — what
the branded careers page itself calls — is open and works from plain Node.

**Eightfold's `domain` parameter is the tenant's registered domain, not the
hostname.** Mayo Clinic is `mc.org`, not `mayoclinic.org`, matching its
`mc.eightfold.ai` tenant. Guessing the obvious one returns a flat 404 that looks
exactly like a board that does not exist. Read the right value off the careers
page's own network call.

### jobs2web locations need their own US test

SuccessFactors writes locations as `City, Region, CC, postcode` with an **ISO
country code**, and that shape defeats the generic `isUsLocation()` helper. EY's
board is largely Indian, and `"Noida, UP, IN, 201301"` contains `, IN,` — which
is **Indiana**. Unfiltered, EY reported **286 "US" roles**; with the
position-aware test it is 11. `ID` is Indonesia and Idaho, `AR` is Argentina and
Arkansas, `DE` is Germany and Delaware.

Use `usJobs2WebOnly()` from `jobs2web.js` for these sources, never `usOnly()`.
The country is the last segment once a trailing postcode is dropped.

### Findly runs two different backends

Findly sites 404 on every obvious search path while serving a ~1.4MB SPA, which
reads as unreachable. They are not — the page calls a JSON API on `m-cloud.io`
that answers a plain Node fetch. Watching the rendered page's own requests is
what found it, the same technique that cracked Sixth Street and Mayo Clinic.

A tenant uses **one backend or the other**, so check which before writing a
scraper:

| Backend | Endpoint | Keyed by | Example |
|---|---|---|---|
| internal | `jobsapi-internal.m-cloud.io/api/job` | numeric `Organization` | Coca-Cola, `2110` |
| google | `jobsapi-google.m-cloud.io/api/job/search` | `companyName=companies/<uuid>` | Cleveland Clinic |

**The internal backend only honours `SearchText`.** `Keyword`, `Keywords`, `q`,
`Search` and `Query` are all accepted and silently ignored — they return the
full unfiltered list, which looks exactly like a search that matched
everything. Coca-Cola went from 209 results to 9 once the right one was used.

Both expose `primary_country`, so US filtering is exact here — none of the
IN/Indiana ambiguity that jobs2web forced.

## Avature: not reachable from a server, at all

**IBM, Slalom, CBRE.** Do not spend more time here without a decision about
headless browsers.

Avature portals serve real content to a browser and **nothing** to a server:

| Client | Same URL | Result |
|---|---|---|
| Browser | `careers.ibm.com/en_US/careers/OpenJobs/?jobRecordsPerPage=24` | **200**, 159,601 bytes, 24 job links |
| Node `fetch` | identical URL, browser User-Agent, Referer | **202**, **0 bytes**, 0 job links |

This is not a challenge page to solve — the body is genuinely empty. Fetching
the portal root first to pick up a session does not help either: that request
also returns 202 and sets **no cookies**, so there is no session to acquire. The
block happens on the very first request from a non-browser client.

An Avature adapter would therefore need a real headless browser inside the
refresh cron. That does not fit: the cron already runs to a 300s ceiling across
300+ sources, and Promptly is at Vercel's 12-function limit. Treat IBM, Slalom
and CBRE as unreachable unless that architecture changes.

## Consulting and finance sweep, 9 September 2026

Consulting had 8 sources against Finance's 146, while being the second most
common field students use Promptly for. Seven added; the rest are recorded below
so nobody repeats the search.

| Company | Source | Evidence |
|---|---|---|
| AlixPartners | `greenhouse:alixpartners` | Board name returns **"AlixPartners"**. 6 US student roles on first run. |
| West Monroe | `greenhouse:westmonroe5` | Board name returns **"West Monroe (Campus)"** — a dedicated student board. 12 roles, all `2027 ... Intern`. |
| Cornerstone Research | `workday cornerstone/wd501/CornerstoneResearch_Careers` | 200 with a real total. The datacenter is **wd501**, read off the careers page; wd1/wd3/wd5 all return 422. |
| Baker Tilly | `workday bakertilly/wd5/BTCareers` | 200, 447 roles, US-heavy. |
| Forrester | `workday forrester/wd501/careers` | 200. Small board. |
| Nasdaq | `workday nasdaq/wd1/Global_External_Site` | 200, 87 roles, largely international — `usOnly()` carries the filtering. |
| CME Group | `workday cmegroup/wd1/cme_careers` | 200. The careers page does not expose the host, so the datacenter was found by trying: **wd1** works, wd5 and wd3 return 422. |

### The trap this sweep hit

`lever:oliverwyman` resolves, returns HTTP 200, and is **not** Oliver Wyman. It
holds two jobs — an Account Executive and a Software Engineer, both in San
Francisco. Oliver Wyman is a global consultancy with hundreds of roles. This is
the same class of error as `ashby:silver` being Silver.dev: a resolving token
proves nothing.

Oliver Wyman's real board is `phenom:mmc`, the Marsh McLennan tenant. Not added:
Phenom sources each need their own scraper in `company-scrapers/`, and a shared
parent tenant would mix Mercer, Marsh and Guy Carpenter roles into cards
attributed to Oliver Wyman.

### McKinsey: found by watching the page, not the markup

McKinsey is JavaScript-rendered, so `discover-ats.js` reports nothing. Opening
the careers page in a browser and reading its own resource list gave:

```
https://gateway.mckinsey.com/apigw-x0cceuow60/v1/api/jobs/search?pageSize=200&start=1&lang=en
```

It answers a plain server fetch — 592 postings — which is what makes it usable.
Two behaviours would break an adapter written by analogy with the others:

- **`start` is a 1-based PAGE NUMBER, not a row offset.** `start=0` and
  `start=1` both return the first page; `start=200` returns **HTTP 500**.
- **Sending a search term returns HTTP 400**, not an empty list, so filtering
  has to happen after the fetch.

And one data shape worth knowing: a single posting carries an **array of cities
across several continents**. One "Business Analyst Intern" is open in Atlanta,
Athens and Abu Dhabi at once. The scraper reduces each posting to its US cities
and drops it when there are none.

### Morgan Stanley: Eightfold, found by trying the subdomain

`morganstanley.com/careers` renders its job list with JavaScript and links to
nothing an ATS pattern matches, so both `discover-ats.js` and reading the page's
own network calls came up empty. What worked was trying the vendor subdomain
directly: **`morganstanley.eightfold.ai`** answers, and the adapter returns 150
US roles.

The `domain` parameter is `morganstanley.com`; **`ms.com` returns 404**. Another
instance of the rule above — this value is not reliably the hostname.

### The Eightfold dates were all 1970

Found while checking that feed, and it affected every Eightfold source already
live. `eightfold.js` carried a comment stating `postedTs` is epoch
**milliseconds** and the conversion trusted it. It is epoch **seconds**.

Live Qualcomm data, 9 Sep 2026: `postedTs` `1788912000` is `2026-09-09`. Read as
milliseconds it is `1970-01-21`. Every Qualcomm, Ford and Mayo Clinic posting
carried a 1970 date, which feeds the recruiting-cycle calendar and the "posted"
line on a card — they sorted as 56 years old.

The conversion is now unit-guarded rather than blindly multiplied, so if
Eightfold ever switches to milliseconds the dates do not jump to the year 58000.

### Checked in this sweep and not addable

| Company | Found | Why not |
|---|---|---|
| Bain & Company, Kearney, Deloitte, PwC, KPMG, Mercer, Willis Towers Watson, Korn Ferry, Gartner, L.E.K., Brattle Group | nothing in the markup | Careers page renders the job list with JavaScript. Needs a browser, or the network tab. |
| BCG | `eightfold:bcg` | Adapter runs but returns 0 rows for `bcg.com`. Per the Eightfold note above, the `domain` parameter is the tenant's registered domain and is probably not the hostname. Worth another look. |
| Analysis Group, Exponent, ZS Associates, Aon | iCIMS | No iCIMS adapter. |
| Grant Thornton, BDO USA | `oracle:us2` | No Oracle adapter. |
| Bank of America | `workday ghr/wd1/lateral-us` | Reads fine (964 roles) but it is the **lateral** board — experienced hires by definition. No campus site found: `campus-us`, `Campus_US`, `students-us`, `university-us` all 404. |
| Accenture | `workday accenture/userHome` | `userHome` is the account page, not a job site. |
| RSM US | `workday rsm/login` | Same — a login route, not a board. |
| Evercore, Centerview, Perella Weinberg, Jefferies, Morgan Stanley, Barclays, UBS, Nomura, Mizuho, Wells Fargo, Bridgewater | nothing in the markup | Same JavaScript-rendered problem. |

### Second sweep, 9 September 2026 — the JavaScript-rendered names

Worked through the employers the first sweep could not see, using a browser to
read each page's own network calls.

| Company | What was found | Why it is not usable |
|---|---|---|
| Deloitte | Avature at `apply.deloitte.com`, and **it does serve HTML to a server** — job titles, locations and detail URLs are all in the markup | Not a rendering problem, a volume one. The page returns **10 results and ignores `jobRecordsPerPage`**, paging only via `jobOffset`, and `search=` returns an empty body. Covering Deloitte US would be 100+ requests every hourly refresh. Correcting the note below: Avature is not uniformly unreadable — Deloitte's instance is readable and simply impractical. |
| Bain & Company | Cloudflare interstitial ("Just a moment…") before any content | Bot protection. A server fetch would be challenged even if an endpoint were found. |
| Wells Fargo | `wellsfargo.eightfold.ai` resolves | `/api/pcsx/search` returns **403 "PCSX is not enabled for this user."** The tenant exists; the open API is switched off. |
| Kearney, L.E.K., Gartner, Korn Ferry, Mercer, KPMG, PwC, Jefferies, Evercore, Centerview, Perella Weinberg, Barclays, UBS, Bridgewater | nothing | No Eightfold tenant, and no Workday tenant at any tried combination of tenant/datacenter/site. Guessing Workday tenants produced zero hits across 14 firms — consistent with the rule that guessing does not work. These need the network tab, one at a time. |

## Tried and NOT addable

None of these is a failure to try harder at. Each is a real constraint, and
adding a source we cannot actually read creates a permanent "Awaiting posting"
card — the exact trust problem the registry exists to avoid.

| Company | What was found | Why it is not usable |
|---|---|---|
| Chegg | `workday` tenant `osv-chegg`, site `Chegg`, from jobs.chegg.com | The Workday jobs endpoint returns **422** for that tenant/site and for `chegg`, `Chegg_Careers`, `External`. 422 means wrong tenant or site, so the board we can see is not the one we can read. |
| IBM, Slalom, CBRE | Avature | Serves nothing to a server client. See the Avature section above. |
| Pearson | `oracle:em3` | No Oracle adapter in `aggregator.js`. Supported: greenhouse, workday, lever, ashby, smartrecruiters, florecruit, usajobs, taleo, custom. |
| Publicis Groupe | `icims:publicisgroupe` | No iCIMS adapter. |
| Lawrence Berkeley Lab | `taleo:lbl` | The Taleo adapter returns **0 raw listings** for sections 1, 2 and 3. The tenant is probably not `lbl`, or the page shape differs from the Federal Reserve Board layout the adapter was pinned against. |
| SEC | — | Already live via USAJOBS as "Securities and Exchange Commission". Needs no source; the placeholder is suppressed by `COMPANY_ALIASES`. |

## Nothing discoverable from the careers page

State, CIA, FBI, NASA, World Bank, IMF, United Nations, Omnicom, Edelman,
Wieden+Kennedy, Interpublic, NIH, Broad Institute, Cold Spring Harbor Lab,
Los Alamos Lab, UNICEF, World Wildlife Fund, Peace Corps, Coca-Cola, Nestlé,
Colgate-Palmolive, 2U, Condé Nast, Bloomberg, CBRE, Related Companies,
Wachtell Lipton.

Their careers pages render the job list with JavaScript, so the ATS URL is not
in the HTML the script receives. That does not mean they have no readable feed —
it means discovery needs a browser, or the ATS has to be identified another way
(open the careers page yourself and watch the network tab for the request the
job list actually makes).

**The federal agencies are a special case.** State, CIA, FBI, NASA and NIH post
through USAJOBS, which Promptly already reads. They are absent from the feed
because USAJOBS is returning no matching student postings for them right now,
not because coverage is missing. Expect them to appear on their own.

## Verification is not optional

Before adding anything:

- **Greenhouse** — `https://boards-api.greenhouse.io/v1/boards/<token>` returns
  `name`. It must be the employer you think it is.
- **SmartRecruiters** — returns HTTP 200 with `totalFound: 0` for *any* string.
  A zero is **no evidence at all**. Verified with `asdfqwerzxcv999`.
- **Ashby / Lever** — no name in the API. Fetch the board page and read its
  `<title>`.
- **Workday** — 422 means wrong tenant/site; 200 plus a total means real.
- Already caught this way: `ashby:silver` is Silver.dev not Silver Lake,
  `ashby:eli` is Eli Health not Eli Lilly, `lever:blue` is BlueCloud,
  `greenhouse:general` matches both GM and GE.

Then run the listing through `aggregateOpenings()` and check for leakage —
foreign locations, senior titles — before merging.

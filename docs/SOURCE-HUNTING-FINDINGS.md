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

## Avature: it depends on the tenant — check, don't assume

**Corrected in round six.** This section used to say Avature was unreachable
from a server, full stop. That is true of some tenants and false of others, and
believing the blanket version cost RGP and Maximus several rounds.

Two tenants ARE readable from plain Node, and their whole list is
server-rendered. `api/_shared/avature.js` reads them:

| Tenant | URL | Paging |
|---|---|---|
| RGP | `careers.rgp.com/Careers/SearchJobs/?jobRecordsPerPage=40&jobOffset=0` | honours the page size — 113 reqs in three requests |
| Maximus | `maximus.avature.net/careers/SearchJobs/?folderOffset=0` | page size IGNORED, always six, so read it through `&search=<term>` instead |

Note the two parameter families: `jobRecordsPerPage`/`jobOffset` on one
generation, `folderRecordsPerPage`/`folderOffset` on the other. Neither is
documented; both are in the pager's own hrefs, which is where to look.

Rows are identical in both — `<article class="article article--result">` with
the title in an `h3 > a`. The location is not: RGP fills a
`list-item-locationBuiltIn` span, Maximus leaves that slot to a posted date and
writes the country into the URL slug
(`/FolderDetail/United-States-Senior-Cybersecurity-Engineer…/43712`).

The ones that genuinely are unreachable are the NEWER React portals, which is a
different failure: they serve a server no rows at all and expose no offset
anywhere.


**IBM, Slalom, CBRE, Avanade.** Do not spend more time on these without a
decision about headless browsers.

These portals serve real content to a browser and **nothing** to a server:

| Client | Same URL | Result |
|---|---|---|
| Browser | `careers.ibm.com/en_US/careers/OpenJobs/?jobRecordsPerPage=24` | **200**, 159,601 bytes, 24 job links |
| Node `fetch` | identical URL, browser User-Agent, Referer | **202**, **0 bytes**, 0 job links |

This is not a challenge page to solve — the body is genuinely empty. Fetching
the portal root first to pick up a session does not help either: that request
also returns 202 and sets **no cookies**, so there is no session to acquire. The
block happens on the very first request from a non-browser client.

Reading these would need a real headless browser inside the refresh cron. That
does not fit: the cron already runs to a 300s ceiling across 700+ sources, and
Promptly is at Vercel's 12-function limit. Treat IBM, Slalom, CBRE and Avanade
as unreachable unless that architecture changes — but test any NEW Avature
tenant against the adapter first, because the readable generation is common.

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

### Round three, 9 September 2026 — bulk token verification

Sixty-odd candidate tokens checked against Greenhouse, Ashby and Lever, keeping
only those whose board states a matching employer name. Ten added:

| Company | Source | Field |
|---|---|---|
| Riveron | `ashby:riveron` | Consulting |
| Point B | `lever:pointb` | Consulting |
| Propeller Consulting | `greenhouse:propellerconsulting` | Consulting |
| Gemini | `greenhouse:gemini` | Finance — Digital Assets |
| Ripple | `greenhouse:ripple` | Finance — Digital Assets |
| Fireblocks | `greenhouse:fireblocks` | Finance — Digital Assets |
| BitGo | `greenhouse:bitgo` | Finance — Digital Assets |
| Mercury | `greenhouse:mercury` | Finance — Fintech |
| General Catalyst | `greenhouse:generalcatalyst` | Finance — Venture Capital |
| Bessemer Venture Partners | `greenhouse:bessemerventurepartners` | Finance — Venture Capital |

**All ten fetch cleanly and all ten produce zero student roles today.** These are
monitoring bets on categories the registry had nothing in — digital assets and
venture capital — not sources that add listings now. Judge them in October, when
VC analyst programmes open.

#### Rejected in this round for unproven identity

Ashby exposes no employer name, so a board with the right slug is not evidence.

- `ashby:circle` — 10 remote roles including "AI Core"; reads like circle.so, not
  Circle Internet Financial. Unproven.
- `ashby:alchemy` — 20 SF/NY roles. Plausibly Alchemy, not provable.
- `greenhouse:alloy` **and** `lever:alloy` both exist with different jobs. Two
  different Alloys — exactly the ambiguity that makes guessing unsafe.
- `greenhouse:mesh` and `ashby:mesh` — same problem.

#### A collision the tests caught

Adding Gemini made `tests/company-normalization.test.js` fail: **"Capgemini"**
on the watch-list fuzzy-matches **"Gemini"**, because the shorter name is a
substring of the longer. They are unrelated — a French IT services group and a
US digital-asset exchange. Recorded in `REVIEWED_NOT_THE_SAME` rather than
aliased; aliasing would have sent Capgemini watchers crypto-exchange roles.

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

## 500-firm list, round three — 15 September 2026

Registry 532 → 690 sources. Every entry on Trey's list now has a status in
[`CONSULTING-500-STATUS.md`](CONSULTING-500-STATUS.md): 329 of 500 are covered
by a live card, 146 are walls (or practice areas of a walled firm), 25 have no
US hiring.

### Methods that found boards when the careers page showed nothing

- **Read the Apply link, not the careers page.** Marketing sites that block
  servers often hand off to an ATS that does not. Open one job in a browser
  and read where Apply goes: Kroll (Cloudflare Turnstile) → Oracle
  `hcxs.fa.us2/CX_1`; SAIC → Oracle `eihu.fa.us8/CX`; Stantec's `.jobs` site →
  Oracle `hdhl.fa.us6/CX_1`; Burns & McDonnell → Taleo on `apply.burnsmcd.com`;
  Cognizant → Taleo (but that section redirects back to the challenge).
- **Workday tenant probe.** POST `…/wday/cxs/<tenant>/<site>/jobs`: a wrong
  datacenter or unknown tenant answers **422**; the right datacenter with a
  wrong site answers **404** (so a 404 proves the tenant exists); the right
  site answers 200. Found Gartner (`gartner/wd5/EXT` — jobs.gartner.com is
  Cloudflare-walled, the Workday board is not), Parsons, CACI, Amentum (on the
  inherited `pae` tenant, site `Amentum_Careers`), Alira Health, Impact
  Advisors, Russell Reynolds and Spencer Stuart tenants. **Always confirm with
  `hiringOrganization` on a real req** — see the impostors below.
- **The ATS's own public board.** Health Advances' site is Cloudflare-walled,
  but its jobs are ClearCompany's and `healthadvances.hrmdirect.com` is open.
- **Public internship lists** (SimplifyJobs READMEs) carry real apply URLs;
  CACI's Workday site came from there.

### Adapters added (all in `api/_shared/`, each with a test)

| Module | Unlocked | The non-obvious part |
|---|---|---|
| `icims.js` | Kimley-Horn, Dewberry, Peraton, BerryDunn, LMI, Geosyntec, Analysis Group, HMA, Wakely, Lumanity, IDC, Cadmus, SKDK | Portals server-render with `in_iframe=1`. Location label varies by portal, and the country code comes FIRST: `CA-ON-Toronto` is Canada, never California. |
| `sf-careers.js` | Wipro, HCLTech, OPEN Health | Newer SuccessFactors sites render no rows; `POST /services/recruiting/v1/jobs` does, and honours the tenant's country facet. Country lives in a different field per tenant. |
| `taleo.js` (REST) | HDR, Segal, Burns & McDonnell | `rest/jobboard/searchjobs` needs the section's portal id (published in the page's own links) and a `tz` header — without it, HTTP 500 "An Error Occurred in TEE". Custom hosts work. |
| `csod.js` | Simon-Kucher, Mathematica | The career-site page embeds a guest token (user -5006) and API host; the search POST uses it. |
| `mmc.js` | Mercer, Oliver Wyman, NERA, Marsh, Marsh McLennan Agency, Guy Carpenter | One Workday board for six businesses; each req's detail names its legal entity. |
| `yello.js` | Kearney | Board pages render 25 rows; its search route returns the rest. "Americas" ≠ US, so an exact US city is required. |
| `small-ats.js` | 35 firms on Workable, UKG, ADP, Paylocity, Pinpoint, Recruitee, Jobvite, Rippling, Teamtailor, Breezy, BambooHR, JazzHR, ClearCompany, HiBob | First-class registry types. US from each feed's own country field. HiBob needs a `companyidentifier` header. |

Also: `positiveUsOnly` now works on Greenhouse/Lever/Ashby; Workday takes
`workdayFacets` (Accenture, TYLin, Parsons, Alira write no country in
locationsText — the Country facet is what proves US); jobs2web reads
"US +5 more" as US (Black & Veatch 19 → 36 roles); a graduation year is no
longer read as the term; "Summer Consultant" is an internship title; recruiting
events are not jobs.

### Impostors rejected by the hiringOrganization / page-title check

`workday:envista` is Envista Holdings (dental), not enVista; `workday:slc` is
the UK Student Loans Company, not AtkinsRéalis; `workday:ccc` is Altium
Packaging, not CrossCountry (whose real board is `lever:crosscountry-consulting`);
`lever:oliverwyman` is "Oliver Wyman Labs" (two SF tech roles) — the Oliver
Wyman card now reads the real consultancy through `mmc.js`.

## 500-firm list, round four (16 Sep 2026)

Round three closed with 329 of 500 entries covered and ~146 walls. Round four
went back at those walls and got to **375 of 500**. Most of that jump is three
firms: Deloitte, PwC and KPMG each carry a dozen or more of the list's entries
as practice areas, and none of them had a card.

### The walls that were not walls

Every one of these had been recorded as unreadable, and every one was readable
once the right door was tried. The pattern is worth keeping: **a "wall" is
usually a wrong URL, a missing facet, or a front end in front of a plain board.**

| Firm | What the note said | What was actually true |
|---|---|---|
| **PwC** | "no readable job feed (script-rendered)" | pwc.com links jobs-us.pwc.com (Phenom), and every job link on it points at `pwc/wd3/US_Entry_Level_Careers` — a plain Workday board, 448 reqs, all US entry-level. Earlier rounds probed `jobs.us.pwc.com`, which does not resolve; the host has a hyphen. |
| **Deloitte** | "Avature serves 10 reqs a page: 100+ requests per refresh" | True but beside the point. The page's own banner config names its facet ids; field 9339 (Hire Type) = 477,478 narrows thousands of reqs to ~140. 15 pages, read four at a time, 8s. |
| **KPMG** | "no readable job feed" | kpmguscareers.com server-renders whole rows. It honours no offset parameter under any name, but it honours `keyword`, so a union of student terms reads it. A subset, and labelled as one. |
| **CACI** | slug search found a 14-req SmartRecruiters board | caci.com points at searchcareers.caci.com — Eightfold, 283 reqs, 28 student roles. |
| **Lockton** | Taleo section, legacy parser saw nothing | Both Taleo and the Next.js shell render an empty list. The page fills itself from an Algolia index using the search-only key it publishes to every visitor. 21 internships. |
| **Arcadis** | "Eightfold tenant, registered domain unknown" | The domain is `arcadis.com`; the tenant that answers is `arcadis.eightfold.ai`, not careers.arcadis.com (which 404s the API). |
| **Paycom** (Eagle Hill, RVK, Cornerstone Advisors) | "session-bound service" | Not session-bound. `/portal/<key>/career-page` returns the boot JSON — including a `sessionJWT` minted for any anonymous caller — but ONLY when asked with `Accept: application/json`; it serves the HTML shell to anything that will take text/html. |
| **ISG** | Jobvite board read as empty | Jobvite has two templates. The newer one uses divs, and serves `/jobs` as a marketing page with only a Featured Jobs widget; the real list is at `/search?nl=1&fr=true`. |

### Ownership: a resolving slug still proves nothing

Guessing slugs across 14 ATSs for 144 firms produced ~70 candidates. A hit was
only believed when the board's own name matched the firm in full **and** the
board pointed back at the firm's domain — and each survivor was then read by
hand. That rejected Spencer Animal Hospital for Spencer Stuart, Kepler
Communications for Kepler Cannon, Kin Insurance for Kin + Carta, Genesis Global
for Genesis Research, Coalition Inc for Coalition Greenwich, a Huntsville
defence shop for TCS, and a Dutch IT firm, a Kansas City builder and a
construction outfit all answering to "centric".

**Pinpoint's five-job boards are sales demos.** Nine firms' slugs resolved on
pinpointhq.com, each with exactly five generic roles ("Head of DEI - Belfast",
"Cloud Architect"). None was the firm's board.

The registry's own duplicate lint caught four more: EPIC Insurance Brokers, The
Chartis Group, Riveron and Valtech were already covered under different names,
which is also the answer for HealthScape Advisors, Effectus Group, Putnam
Associates (Inizio), Kalypso (Rockwell) and Insight Sourcing (Accenture).

### Adapter changes this round

| Change | Why |
|---|---|
| `paycom` reader in `small-ats.js` | Two-step: career-page JSON for a guest token, then one POST. Locations are free text carrying street addresses and legal entities, so the US test runs on the cleaned "City, ST" part. |
| `jobvite` reader falls back to `/search?nl=1&fr=true`, accepts div rows | The newer career-site template, above. |
| Ashby fetcher reads `address.postalAddress.addressCountry` | A remote req writes only "Remote"; the country is structured. Chartis' board is 40 reqs, mostly that shape — a text-only gate dropped a US employer entirely. |
| `stateFirstLocations` source flag | PwC writes "IL-Rosemont" and names no country. Opt-in, never automatic: "CA-Toronto" is California to this pattern and Canada to an ISO reader, so a board earns the flag only once its locations have been checked. |

### Still not addable, with the reason established this round

- **Bot protection (hard line, not attempted):** Bain, Alvarez & Marsal,
  Cognizant, Globant, UST, Steer (403 to a server); IBM, Jacobs (202 challenge
  page); Tetra Tech (SelectMinds 403).
- **Client-rendered with no readable route:** Avanade, Alliant (Dayforce needs
  the page's session), CGI (njoyn answers "Session Expired"), Mott MacDonald,
  North Highland, Credera, GEP, Efficio, Everest Group, Arup, AECOM.
- **Feed exists but is unusable:** Slalom and Maximus (Avature feeds are a
  fixed latest-20, no offset, no locations); EPAM (its search API answers a
  plain fetch and ranks by relevance but does not filter — even a nonexistent
  field returns hits — and 3,708 reqs at 50/page × 700KB is not affordable);
  Virtusa (Phenom search ignores the keyword server-side); TCS (login-only
  iBegin); Infosys (career.infosys.com covers India, China and Manila only —
  there is no US portal behind it).
- **No US hiring, having looked:** Ricardo, Emerton, Sionic, Oxera, South Pole,
  4C Associates, Implement Consulting Group, Miebach's German board (its North
  America board IS readable and was added), Serco.

### The last sweep, and why the remaining walls are real

North Highland's wall ("job API requires a session token") turned out to be a
GET against a POST-only route. That is a mistake worth not repeating, so every
still-uncovered firm was then swept for the job APIs small careers sites
actually use — SourceFlow's `/_sf/api/v1/jobs/search.json`, the WordPress REST
job post types, `/api/jobs`, `/jobs.json` and others — with **both** GET and
POST, across `careers.`, `www.` and `jobs.` on each domain. 111 firms, ~4,000
requests, **zero hits**. The remaining walls are walls.

### Refresh budget

A timed run of all 716 sources at the production concurrency (12) took **191.5s**
against the refresh function's 300s ceiling. Deloitte (8s), KPMG (10s) and North
Highland (5s) are well outside the twenty slowest; the slowest are AbbVie (44s),
Oliver Wyman (31s), HUB International (25s), BCG (22s) and Arcadis (21s). Watch
this number as the registry grows.

That run is also how a dead source was found: Alpine Investors' Greenhouse board
404s — it moved to Ashby. **Time the whole registry occasionally; it is the only
check that notices a board that quietly went away.**

## 500-firm list, round five (22-23 Sep 2026)

Round four closed at 375 of 500 with 86 "not addable". This round re-attacked
those, and the headline is a method error rather than a set of new walls.

### The miss: every sweep had only read careers LANDING pages

48 of the 86 were recorded as "no job board found: careers page has no ATS
link, feed or embed". That was true of the page each sweep looked at, and
wrong about the firm. The board is routinely on a careers SUBPAGE:

| Firm | Landing page | Where the board actually is |
|---|---|---|
| Logic20/20 | nothing | `/careers/join-the-team/` — SmartRecruiters `Logic2020Inc` |
| Centric Consulting | `/careers/` 404s | `/about-us/careers/` — Taleo Business Edition |
| GEP | nothing | `/careers/join-us/campus-connect` — iCIMS (dead, see below) |
| Credera | nothing | `/careers/students` — Greenhouse (dead, see below) |

Following one level of careers subpages, and scanning each subpage's own JS
bundles, is now the baseline. Landing-page-only sweeps produce false walls.

### Taleo Business Edition is a second Taleo, and it needs two requests

`phg.tbe.taleo.net` is a different product from the `careersection` Taleo in
`taleo.js`; they share a brand and nothing else. Asking `/searchResults`
directly returns the search FORM — 200, 98KB, no rows, no error — which is
indistinguishable from an employer with nothing open. `/jobSearch` first issues
a JSESSIONID; the results only exist for a caller carrying it. Ten rows a page,
paging on `rowFrom`. See `api/_shared/tbe.js`.

That also settles an old ambiguity: slug-guessing had found three "centric"
boards (a Dutch IT firm, a Kansas City builder, a construction outfit) and
rejected all three without finding the real one.

### Boards the firm itself links, and which are dead

Worth separating from "we could not find it" — these were found, and are gone:

- **Credera** embeds Greenhouse `crederacampuses` on its students page. That
  board 404s, and the page's "apply here" link loops back to it. Their own
  student board is broken.
- **GEP** links iCIMS `jobsamericas-gep`, which answers with iCIMS' own
  decommissioned-portal page: `gone: jobsamericas-gep.icims.com : dc409`. Every
  GEP variant tried (`gep`, `careers-gep`, `jobs-gep`, `gepcareers`,
  `jobsindia-apac-gep`) returns the same. GEP has left iCIMS.

### No board because there is no board

Eight firms take applications by email, which is a real answer rather than a
failed search — there is nothing to monitor and never will be until they adopt
an ATS:

Bully Pulpit (`jobs@bpigroup.com`), Genesis Research (`careers@genesisrg.com`),
Hattaway (`hr@hattaway.com`), NovaRest (`careers@novarest.com`), Patomak
(`jobs@patomak.com`), Wolff Olins (`talent@wolffolins.com`), Boston Strategic
Partners (`info@bostonsp.com`), and GEP/Jump Associates/Maine Pointe/Nagarro on
generic company addresses.

**Epsilon Economics has no DNS at all** — the firm's site is gone.

**Persistent Systems** redirects to `validate.perfdrive.com`, a Radware bot
check. Off-limits, as ever.

### Method note for next time

The three techniques that found everything this round, in order of yield:

1. Follow careers subpages, and scan their JS bundles — not just the landing page.
2. Classify what is actually on the page (ATS / email / nothing), so a firm
   without a board gets a status instead of another sweep.
3. When a board answers 200 but shows no rows, check whether it wants a session
   before concluding it is empty. That single check was the difference between
   "Centric has no board" and 24 live requisitions.

## 500-firm list, round six (25 Sep 2026)

Round five's method was "read the careers page". Round six's is **follow the
firm's own site to the board**, which moved fourteen more firms. Two techniques
did all of it.

### Read the job links, not the careers page

A careers page often names no ATS while a JOB LINK on a neighbouring page names
the tenant outright.

| Firm | Where the answer actually was |
|---|---|
| Spencer Stuart | `/who-we-are/careers-paths` — not the careers page — links `spencerstuart.wd5.myworkdayjobs.com/Spencer_Stuart_External_Careers` |
| AtkinsRéalis | their job API's `external_posting_url` points at Workday tenant **`slihrms`** — SNC-Lavalin, their former name. No amount of guessing "atkins" would ever have found it |
| Avanade | a job page's apply button points at `avanadeta.avature.net` (which then 404s every public search path, but the tenant is now known) |
| Perficient | `careers.perficient.com` redirects to `/en/sites/CX_1` — Oracle Recruiting Cloud on their own domain. The earlier "0 reqs for every search" was the right site number against the wrong host |

### Crawl the careers pages two levels deep

`scripts/`-style landing-page reads miss boards that sit on subpages. A two-level
crawl of the firm's own careers section found:

| Firm | ATS | Page it was on |
|---|---|---|
| Arthur D. Little | iCIMS `internships-adlittle` | three levels down, under `careers/working-us` |
| Bully Pulpit Interactive | Workable `bully-pulpit-international-1` | `/careers-na`, not `/careers` |
| enVista | UKG `ENV1003ENVIS` | `/about/careers/` |
| Nagarro | SmartRecruiters `Nagarro1` | seventeen pages in |
| GEP | iCIMS `jobsus-gep` etc. | `/careers/join-us/campus-connect` — and all four portals are decommissioned |

**Guessing a token by company name is worse than useless.** The only "envista"
Workday board is Envista Holdings, a dental company; the only "slc" hit was the
UK Student Loans Company. Both would have been added as the wrong employer.

### Some firms ARE the board

Three firms filed as "no job board found" keep their openings on their own site
with no ATS anywhere. The employer's own page is the authoritative source, so
these are addable with a small reader:

- **Kittelson & Associates** — WordPress articles. Three live Summer 2027
  internships. Offices are in separate `<span>`s and must be joined.
- **Boston Strategic Partners** — WordPress posts, each linked twice (once by
  title, once by a "Read More »" button, so take the first).
- **Synapse Energy Economics** — Trakstar Hire, the old Recruiterbox. Its
  careers page names nothing; the tenant (`synapseenergy`) is only inside the
  widget's JavaScript. It publishes RSS at `/jobfeeds/<tenant>`, which
  `api/_shared/trakstar.js` reads.

### Two entries in the status table were simply wrong

North Highland and HCLTech have had live cards for some time. HCLTech's row had
even been given Maximus' reason, copy-pasted. **Cross-check the status doc
against `SOURCES` before trusting a "not addable".**

### The bug the additions exposed

Workday collapses a multi-office requisition's locations to a COUNT — "5
Locations" — which names no city and no country. A source marked
`positiveUsOnly` had nothing to confirm, so it dropped the req. That was costing
**46 real US student roles across 16 employers**, including all fourteen of
Nike's internships and six of CACI's. `fetchWorkday` now asks the posting's own
detail endpoint for the offices, for collapsed reqs that already look
student-relevant. Pinned in `tests/workday-collapsed-locations.test.js`.

Arthur D. Little exposed a second one: its whole student board is titled "Summer
Business Analyst 2027" and "Winter Business Analyst 2027", which matched no
intern phrase, so all six were served as New Grad roles. `INTERN_TITLE` now
accepts a practice word between the season and the title — required, and only
after summer/winter, so a bank's "2027 Fall Analyst Program" (a full-time campus
class) stays on the new-grad path.

### New walls, precisely

| Firm | Why |
|---|---|
| Virtusa | Phenom `VIRVIRGLOBAL` behind Akamai; the `/widgets` jobs route 403s servers |
| Mphasis | RippleHire; `candidatejobsearch` 500s for every payload shape tried, including from inside a live browser session |
| CGI | Njoyn, behind a Radware captcha page |
| AECOM | `aecom.jobs` is a client-rendered shell; its `prod-search-api.jobsyn.org` Solr API answers 400 without an origin and 403 with one it does not recognise |
| SoftServe | Incapsula |
| EPAM | now a Cloudflare challenge — it used to answer |
| Slalom, Avanade | the newer React Avature portals: no rows to a server, no offset in the markup |
| Egon Zehnder | softGarden, readable, but every requisition is German, Swiss or Austrian |
| Russell Reynolds | no board — `/careers/join-us` is a talent-acquisition contact form |
| FutureBrand | no careers section on its website at all |
| Genesis Research | openings are listed as text with no per-role link, so there is nothing to send a student to |

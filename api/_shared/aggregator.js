// ─────────────────────────────────────────────────────────────────────────
// Openings aggregator. Pulls live job reqs from each employer's ATS feed,
// keeps only real 2027 US summer internships, and normalizes them into the
// same shape the frontend uses. A posting is only kept if it is present in
// the employer's own live feed — that presence IS the verification, so dead
// or filled reqs drop out automatically on the next refresh.
// ─────────────────────────────────────────────────────────────────────────

const { SOURCES } = require("./sources");
const { isUsLocation: isPositiveUsLocation } = require("./us-location");

// Non-US locations. Extended after an audit found roles in Bristol, Tel Aviv,
// Taipei and others slipping through into a US-only product. Country names are
// included because many feeds give "Bristol, United Kingdom" with a city we
// don't list.
const INTERNATIONAL = /london|hong ?kong|singapore|japan|munich|germany|india|toronto|calgary|montr|ottawa|waterloo, on|amsterdam|shanghai|sydney|melbourne|brisbane|perth|auckland|paris|zurich|geneva|dublin|tokyo|osaka|seoul|taipei|taiwan|\bhk\b|\buk\b|united kingdom|england|scotland|wales|ireland|tel aviv|israel|herzliya|madrid|barcelona|milan|rome|frankfurt|berlin|hamburg|stuttgart|warsaw|poland|krak|bucharest|romania|budapest|hungary|prague|czech|vienna|austria|bangalore|bengaluru|hyderabad|mumbai|pune|chennai|gurgaon|noida|manila|philippines|jakarta|indonesia|kuala lumpur|malaysia|selangor|petaling jaya|penang|johor|bangkok|thailand|vietnam|hanoi|shenzhen|beijing|guangzhou|china|dubai|abu dhabi|\buae\b|saudi|riyadh|qatar|doha|vancouver|ontario|quebec|alberta|british columbia|canada|stockholm|sweden|oslo|norway|copenhagen|denmark|helsinki|finland|brussels|belgium|luxembourg|switzerland|netherlands|rotterdam|eindhoven|edinburgh|manchester|glasgow|birmingham, uk|bristol|cambridge, uk|oxford, uk|leeds|belfast|são paulo|sao paulo|brazil|mexico city|guadalajara|bogot|colombia|buenos aires|argentina|santiago|chile|lima|peru|cairo|egypt|nairobi|kenya|lagos|nigeria|johannesburg|cape town|south africa|spain|portugal|lisbon|greece|athens|turkey|istanbul|ukraine|serbia|croatia|slovakia|slovenia|bulgaria|estonia|latvia|lithuania|iceland|malta|cyprus|emea\b|apac\b|latam\b/i;
// Some employers publish one req for several offices, e.g. "Austin, TX,
// United States; London, United Kingdom; Singapore". An international office
// must not hide the same req's explicit US locations.
// Explicit country wording is unambiguous; a bare two-letter state code is not.
// Case matters: lowercase "or" in "New York, London, or Paris" otherwise reads
// as Oregon. Feeds write real state codes uppercase, so require that.
const US_COUNTRY = /\bunited states\b|\busa\b/i;
const US_STATE_CODE = /,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;

// Dutch province codes collide with US state codes (NH = Noord-Holland,
// ZH = Zuid-Holland, UT = Utrecht, FL = Flevoland, NB = Noord-Brabant).
// "Amsterdam, NH" is the Netherlands, not New Hampshire — confirmed on Lucid
// Motors' board, where the neighbouring req at that location is a
// German-speaking role. Only treat the code as foreign when a Dutch city is
// actually present, so real US cities that share a name with a foreign one
// ("Bristol, PA", "Manchester, NH", "Cambridge, MA") still resolve as US.
const DUTCH_CITY = /amsterdam|rotterdam|eindhoven|utrecht|haarlem|the hague|den haag|groningen|maastricht|delft|leiden|tilburg|nijmegen/i;
const DUTCH_PROVINCE_CODE = /,\s*(?:NH|ZH|UT|FL|NB|GE|OV|DR|GR|FR|LI)\b/;

// Is ONE location a US office?
function isUsLocationPart(part) {
  const value = String(part || "");
  if (US_COUNTRY.test(value)) return true;
  if (DUTCH_CITY.test(value) && DUTCH_PROVINCE_CODE.test(value)) return false;
  return US_STATE_CODE.test(value);
}

// A req can list several offices ("Singapore; New York, NY"); it counts as US
// if ANY office is.
function isUsLocation(location) {
  return String(location || "")
    .split(/\s*;\s*/)
    .filter(Boolean)
    .some(isUsLocationPart);
}

const US_LOCATION = { test: (value) => isUsLocation(value) };
// Seniority / staleness / non-student gate — keeps experienced roles, past
// cycles, and internal hiring roles out of BOTH the intern and new-grad paths.
// "recruiter/recruiting" excludes "Campus Recruiter"-type staff jobs that
// otherwise false-match on "early careers".
const EXCLUDE_TITLE = /experienced|senior|staff|principal|\blead\b|manager|director|\bvp\b|vice president|\bii+\b|\b[3-9]\+?\s*years|off[- ]?cycle|recruit(er|ing)|\b2023\b|\b2024\b|\b2025\b/i;
// \b anchors are essential: a bare /intern/ matched "INTERNal Audit Analyst"
// and "INTERNational Business Developer", pulling non-student and overseas
// roles into the feed. Found by sampling real output, not by review.
// \binternship\b alone silently rejected any plural phrasing ("CNN
// International Internships: ATL - Fall 2026", a real, genuinely US Atlanta
// posting) — the trailing "s" is a word character, so no \b boundary exists
// right after "internship" for the plural form to land on. "?s" fixes both
// singular and plural under one pattern; \binterns\b becomes redundant once
// that's in place but is kept for clarity/no-regression.
const INTERN_TITLE = /\bintern\b|\binterns\b|\binternships?\b|\bsummer analyst\b|\bsummer associate\b|\bco-?op\b/i;
const NEWGRAD_TITLE = /new\s?grad|university (graduate|hire)|recent graduate|ph\.?d\.? graduate|early career|entry[ -]?level|campus hire|rotational program|analyst program|\b3l applications?\b/i;
// Titles that only mean "new grad" on a board that is ITSELF student-only.
// "2027 Full Time Analyst" is the canonical campus-hire title in banking, but
// the same words describe an experienced hire on a general board — so this
// pattern is gated behind an explicit source flag (studentBoard: true) and is
// never applied to a general feed. Same reasoning as the USAJOBS hiringPath
// gate: when the FEED is already scoped to students, the feed is the evidence.
const STUDENT_BOARD_TITLE = /\bfull[- ]?time (analyst|program)\b|\banalyst(?:\s+i)?\b|\bgraduate (analyst|programme?)\b/i;
// A generic "Full-Time" title is only meaningful when the employer has
// explicitly put it on a student/recent-graduate board. Keeping this separate
// avoids treating dated full-time retail roles on general boards as campus.
const STUDENT_BOARD_ONLY_TITLE = /\bfull[- ]?time\b/i;
const CYCLE_YEAR = /\b(2026|2027|2028)\b/;
const SEASON = /\b(spring|summer|fall|autumn|winter)\b/i;
// Not a real, student-relevant job req: talent pools, mailing lists, general
// "expression of interest" pages, and hourly production/technician roles that
// aren't the college-intern/new-grad audience.
const NON_ROLE = /mailing list|talent (community|network|pool)|future opportunit|join our|expression of interest|general application|prospective|interested in (an?|our)|register your interest|speculative|pipeline requisition|production technician|assembly technician|\btemporary\b/i;

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function preferUsLocations(location) {
  const value = String(location || "").replace(/\s+/g, " ").trim();
  const parts = value.split(/\s*;\s*/).filter(Boolean);
  if (parts.length < 2) return value;
  const usParts = parts.filter((part) => US_LOCATION.test(part));
  return usParts.length ? usParts.join("; ") : value;
}

// Detect which recruiting cycle a posting belongs to, or null if it's not a
// student-relevant role. Internships require an explicit target year (keeps
// quality tight); new-grad/full-time entry roles are matched by explicit
// early-career markers. Pass allowUndatedIntern for feeds (e.g. USAJOBS)
// where a live listing is inherently current even without a year in the title.
// Live ATS feeds only contain reqs the employer is currently advertising, so an
// internship with no year in its title is a CURRENT internship whose term we
// simply don't know. Rejecting those cost 82 real US roles across 16 employers
// (Point72, DRW, Jump Trading, Roblox…) — a 61% false-negative rate on
// student-relevant titles, and the single biggest reason coverage looked thin.
//
// The honest resolution is to keep them but label the term "Internship" rather
// than guessing "Summer 2027". Unknown beats incorrect: a student filtering for
// Summer 2027 must never be shown a role we cannot place in that cycle.
function detectCycle(title, location, allowUndatedIntern = true, studentBoard = false) {
  if (!title) return null;
  // Check both title and location for international cues — some feeds put the
  // city in the title ("2026 Warsaw Data Internship") and leave location blank.
  if (INTERNATIONAL.test(title) && !US_LOCATION.test(title)) return null;
  if (INTERNATIONAL.test(location || "") && !US_LOCATION.test(location || "")) return null;
  if (EXCLUDE_TITLE.test(title)) return null;                 // not experienced / past cycles
  if (NON_ROLE.test(title)) return null;                       // talent pools / non-reqs
  const yearMatch = title.match(CYCLE_YEAR);
  if (INTERN_TITLE.test(title)) {
    if (yearMatch) {
      // Use the actual season when stated ("Fall 2026" ≠ "Summer 2026"),
      // defaulting to Summer only when no season is named.
      const seasonMatch = title.match(SEASON);
      let season = seasonMatch ? titleCase(seasonMatch[1]) : "Summer";
      if (season === "Autumn") season = "Fall";
      return `${season} ${yearMatch[1]}`;
    }
    return allowUndatedIntern ? "Internship" : null;
  }
  // Campus-hire titles ("Full-Time Analyst") are ambiguous on their own, so
  // they need one of two independent pieces of evidence:
  //   • the BOARD is students-only (studentBoard), or
  //   • the TITLE carries an explicit future cycle year — "2027 Investment
  //     Banking Full-Time Analyst" is a campus class; firms don't put a future
  //     year on an experienced req, which is what makes the year load-bearing
  //     rather than decorative. Verified against William Blair's mixed board,
  //     where every experienced analyst role is undated and every campus one
  //     is dated.
  if (NEWGRAD_TITLE.test(title)
      || (studentBoard && STUDENT_BOARD_ONLY_TITLE.test(title))
      || ((studentBoard || yearMatch) && STUDENT_BOARD_TITLE.test(title))) {
    return yearMatch ? `New Grad ${yearMatch[1]}` : "New Grad";
  }
  return null;
}

// ── Stale cycle gate ──────────────────────────────────────────────────────
// A live posting is not the same as a current opportunity. Employers routinely
// leave a filled Summer 2026 req published, and showing it to a student hunting
// Summer 2027 is exactly the "old role presented as current" failure.
//
// Approximate end month of each term; a cycle is past once that month has gone.
const TERM_END_MONTH = { spring: 5, summer: 8, fall: 12, winter: 3 };

function isPastCycle(cycle, now = new Date()) {
  const text = String(cycle || "");
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (!yearMatch) return false; // undated ("Internship"/"New Grad") — can't call it stale
  const year = Number(yearMatch[1]);
  const seasonMatch = text.toLowerCase().match(/spring|summer|fall|winter/);

  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth() + 1;

  if (!seasonMatch) {
    // "New Grad 2026" — treat as stale only once the following year begins,
    // since new-grad classes start through the autumn.
    return year < nowYear;
  }
  // Winter terms are labelled by the year they end in.
  const endMonth = TERM_END_MONTH[seasonMatch[0]];
  return year < nowYear || (year === nowYear && nowMonth > endMonth);
}

// Back-compat: the original single-cycle gate, kept for existing callers/tests.
function isRelevant(title, location) {
  return detectCycle(title, location) !== null;
}

function cleanRole(title) {
  return String(title).replace(/\s+/g, " ").trim().slice(0, 90);
}

async function fetchJson(url, options) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// ── Greenhouse: public board API, no auth ────────────────────────────────
async function fetchGreenhouse(src) {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${src.board}/jobs`);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  const out = [];
  for (const j of jobs) {
    const loc = (j.location || {}).name;
    const cycle = detectCycle(j.title, loc);
    if (cycle) out.push(normalize(src, j.title, j.absolute_url, loc, cycle, null, j.first_published || j.updated_at));
  }
  return out;
}

// ── Workday: public cxs jobs endpoint, paginated ─────────────────────────
// Workday's searchText is matched server-side, so an over-specific query hides
// real roles: "2027 summer" returns ZERO postings on large tenants (Nvidia,
// Adobe, Boeing) that plainly do list student roles. We instead run a few
// broad student-intent terms and let detectCycle do the strict filtering, which
// is where the quality gate belongs. Results are deduped by posting path.
const WORKDAY_TERMS = ["intern", "new grad", "university graduate"];
const WORKDAY_PAGES = 5; // per term, 20 per page

async function fetchWorkday(src) {
  const base = `https://${src.tenant}.${src.dc}.myworkdayjobs.com`;
  const api = `${base}/wday/cxs/${src.tenant}/${src.site}/jobs`;
  const out = [];
  const seenPaths = new Set();

  for (const searchText of WORKDAY_TERMS) {
    for (let page = 0; page < WORKDAY_PAGES; page += 1) {
      let data;
      try {
        data = await fetchJson(api, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ appliedFacets: {}, limit: 20, offset: page * 20, searchText }),
        });
      } catch {
        break; // this term failed — try the next one rather than abandoning the source
      }
      const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
      if (!postings.length) break;
      for (const p of postings) {
        if (!p.externalPath || seenPaths.has(p.externalPath)) continue;
        // Global employers often return a loose keyword match from every
        // country on one Workday board.  The general international blocklist
        // is deliberately permissive, so an unfamiliar foreign city can look
        // like a US role.  Sources marked positiveUsOnly must instead provide
        // affirmative US evidence (country wording or a state code).
        if (src.positiveUsOnly && !isUsLocation(p.locationsText)) continue;
        const cycle = detectCycle(p.title, p.locationsText, true, Boolean(src.studentBoard));
        if (!cycle) continue;
        seenPaths.add(p.externalPath);
        const url = `${base}/en-US/${src.site}${p.externalPath}`;
        out.push(normalize(src, p.title, url, p.locationsText, cycle));
      }
      if (postings.length < 20) break;
    }
  }
  return out;
}

// ── Lever: public postings API ───────────────────────────────────────────
async function fetchLever(src) {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${src.board}?mode=json`);
  const jobs = Array.isArray(data) ? data : [];
  const out = [];
  for (const j of jobs) {
    const loc = (j.categories || {}).location;
    const cycle = detectCycle(j.text, loc);
    if (cycle) out.push(normalize(src, j.text, j.hostedUrl, loc, cycle, null, j.createdAt));
  }
  return out;
}

// ── Ashby: public posting-api, no auth ───────────────────────────────────
// { ats:"ashby", board:"<token>" } (jobs.ashbyhq.com/<token>)
async function fetchAshby(src) {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${src.board}`);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  const out = [];
  for (const j of jobs) {
    if (j.isListed === false) continue;
    const cycle = detectCycle(j.title, j.location);
    if (cycle) out.push(normalize(src, j.title, j.jobUrl, j.location, cycle, j.workplaceType || null, j.publishedAt));
  }
  return out;
}

// ── SmartRecruiters: public postings API, paginated ──────────────────────
// { ats:"smartrecruiters", board:"<CompanyIdentifier>" }
// Public posting page: jobs.smartrecruiters.com/<CompanyIdentifier>/<id>
async function fetchSmartRecruiters(src) {
  const out = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const data = await fetchJson(
      `https://api.smartrecruiters.com/v1/companies/${src.board}/postings?limit=100&offset=${offset}`
    );
    const postings = Array.isArray(data.content) ? data.content : [];
    for (const p of postings) {
      // The API includes a structured country code — use it (the title/location
      // regex filter still applies afterwards as a second pass).
      const country = String(p.location?.country || "").toLowerCase();
      if (country && country !== "us") continue;
      const location = p.location?.fullLocation
        || [p.location?.city, p.location?.region].filter(Boolean).join(", ");
      const cycle = detectCycle(p.name, location);
      if (!cycle) continue;
      out.push(normalize(src, p.name, `https://jobs.smartrecruiters.com/${src.board}/${p.id}`, location, cycle, null, p.releasedDate));
    }
    if (postings.length < 100) break;
  }
  return out;
}

// ── Flo Recruit: public law-firm career pages ─────────────────────────────
// { ats:"florecruit", board:"<org-friendly-name>" }
// Flo's law-specific ATS exposes each employer's public, current job list with
// stable application IDs, structured offices, and opening/closing dates.
async function fetchFloRecruit(src) {
  const data = await fetchJson(
    `https://florecruit.com/api/v2/public-jobs/${encodeURIComponent(src.board)}/career-page-jobs`,
    { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)" } }
  );
  const jobs = Array.isArray(data) ? data : [];
  const out = [];
  const now = Date.now();

  for (const job of jobs) {
    if (job.isPublic === false || !job.extension || !job.title) continue;
    const opens = job.openDate ? Date.parse(job.openDate) : NaN;
    const closes = job.closeDate ? Date.parse(job.closeDate) : NaN;
    if (Number.isFinite(opens) && opens > now) continue;
    if (Number.isFinite(closes) && closes < now) continue;

    const offices = (Array.isArray(job.jobOffices) ? job.jobOffices : [])
      .map((office) => String(office?.name || "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
    // These firms recruit globally, while Promptly is US-only. Flo supplies
    // full state names ("New York, New York"), so use the positive shared
    // location test rather than aggregator.js's foreign-city blocklist.
    const usOffices = offices.filter(isPositiveUsLocation);
    if (!usOffices.length) continue;
    const location = usOffices.join("; ");
    const cycle = detectCycle(job.title, location);
    if (!cycle) continue;
    const url = `https://florecruit.com/v2/app/${encodeURIComponent(src.board)}/jobs/${encodeURIComponent(job.extension)}/apply`;
    out.push(normalize(src, job.title, url, location, cycle));
  }
  return out;
}

// ── USAJOBS: official federal jobs API (all agencies at once) ─────────────
// { ats:"usajobs", field:"Government", hiringPath:"student;recent-graduates" }
// Requires a FREE API key: developer.usajobs.gov → set USAJOBS_API_KEY and
// USAJOBS_EMAIL in Vercel. Returns [] safely when unconfigured, so the build
// never throws. The HiringPath filter (NOT WhoMayApply) is the API's official
// way to scope to student + recent-graduate roles, so those two paths already
// gate the results — we only add a light seniority guard and drop anything
// clearly not entry-level. NOTE: verify live against the API once the key
// exists; response shape follows the documented SearchResultItems schema.
const GOV_EXCLUDE = /\bsenior\b|supervisor|\bchief\b|\bdirector\b|manager|\blead\b/i;

async function fetchUsaJobs(src) {
  const key = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;
  if (!key || !email) return []; // unconfigured — no-op, never throws

  const hiringPath = src.hiringPath || "student;recent-graduates";
  const params = new URLSearchParams({
    ResultsPerPage: "500",
    HiringPath: hiringPath,
  });
  if (src.query) params.set("Keyword", src.query);
  const res = await fetch(`https://data.usajobs.gov/api/search?${params.toString()}`, {
    headers: { Host: "data.usajobs.gov", "User-Agent": email, "Authorization-Key": key },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} usajobs`);
  const data = await res.json();
  const items = data?.SearchResult?.SearchResultItems || [];
  const out = [];
  for (const it of items) {
    const d = it.MatchedObjectDescriptor || {};
    const title = d.PositionTitle || "";
    // HiringPath already scoped this to student/recent-grad; just drop the
    // occasional senior/management title that sneaks into those paths.
    if (GOV_EXCLUDE.test(title)) continue;
    // PositionURI comes back as "https://www.usajobs.gov:443/job/..." — drop
    // the explicit default port so the link is clean.
    const rawUrl = d.PositionURI || (d.ApplyURI && d.ApplyURI[0]);
    if (!rawUrl) continue;
    const url = String(rawUrl).replace(":443/", "/");
    const location = d.PositionLocationDisplay
      || (Array.isArray(d.PositionLocation) && d.PositionLocation[0]?.LocationName)
      || "";
    const agency = d.OrganizationName || d.DepartmentName || "U.S. Federal Government";
    // Gov listings are inherently current (live + close date), so allow
    // undated internships here; fall back to a New Grad / Internship label.
    const cycle = detectCycle(title, location, true)
      || (/intern|pathways|student/i.test(title) ? "Internship" : "New Grad");
    out.push({
      ...normalize(src, title, url, location, cycle),
      company: agency.slice(0, 60),
      short: "GOV",
      deadline: d.ApplicationCloseDate ? String(d.ApplicationCloseDate).slice(0, 10) : "See posting",
      sourceLabel: `${agency} — USAJOBS verified listing`,
    });
  }
  return out;
}

// ── Custom company scrapers ───────────────────────────────────────────────
// { ats:"custom", handler:"<filename>" } → runs
// company-scrapers/<filename>.js, which must export an async function
// returning [{ title, url, location }, ...]. Use ONLY when a company has no
// feed on one of the 7 standard systems above — see
// company-scrapers/_template.js for the full how-to before adding one.
// Oracle Taleo career sections. Reads the serialised job list out of the
// delivered HTML — see _shared/taleo.js for why the REST endpoint is unusable.
// Taleo carries the employer's own posting date, so postedAt is threaded here.
async function fetchTaleo(src) {
  const { fetchTaleoListings } = require("./taleo");
  const raw = await fetchTaleoListings(src.tenant, src.section || "1");
  const out = [];
  for (const j of raw) {
    const cycle = detectCycle(j.title, j.location, true, Boolean(src.studentBoard));
    if (cycle) out.push(normalize(src, j.title, j.url, j.location, cycle, null, j.postedAt || null));
  }
  return out;
}

async function fetchCustom(src) {
  const fetchListings = require(`./company-scrapers/${src.handler}`);
  const raw = await fetchListings(src);
  const out = [];
  for (const j of Array.isArray(raw) ? raw : []) {
    // studentBoard must be threaded through here too — a custom scraper can
    // point at a students-only careers page just as a Workday site can.
    const cycle = detectCycle(j.title, j.location, true, Boolean(src.studentBoard));
    if (cycle) out.push(normalize(src, j.title, j.url, j.location, cycle, j.workplaceType || null, j.postedAt || null));
  }
  return out;
}

// ── Normalization and identity ────────────────────────────────────────────
// Two feeds can describe the same req with different casing, punctuation,
// tracking parameters, or company suffixes. Identity has to be computed from
// normalized values or the same job appears two or three times.

// Strip tracking/session parameters so ?gh_src=... and ?utm_campaign=... do not
// make one posting look like several.
// gh_jid is not tracking: employers that embed Greenhouse on their own domain
// use it as the job's only identity (all HRT postings otherwise share /job/).
const TRACKING_PARAM = /^(utm_|gh_(?!jid$)|ref|source|src|lever-|trk|mc_|fbclid|gclid|msclkid|_ga|campaign|medium)/i;

function canonicalUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) url.searchParams.delete(key);
    }
    // Trailing slashes are not meaningful on these boards.
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return value;
  }
}

// "Blue Origin, LLC" / "blue-origin" / "Blue Origin Inc." → "blueorigin"
function normalizeCompany(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|llc|ltd|lp|llp|plc|corp|corporation|co|company|group|holdings|technologies|technology|labs|systems|solutions|partners|capital management|the)\b/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

// Drop decoration that varies between feeds but not between jobs:
// "[Summer 2027] Software Engineer Intern (Remote) - New York" → core title.
function normalizeRole(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/\b(20\d{2})\b/g, " ")
    .replace(/\b(spring|summer|fall|autumn|winter)\b/g, " ")
    .replace(/\b(remote|hybrid|onsite|on site|us|usa|united states)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Which of two records for the same job survives. Deterministic, and biased
// toward the most authoritative record rather than whichever arrived first.
const ATS_AUTHORITY = { greenhouse: 5, lever: 5, ashby: 5, smartrecruiters: 4, workday: 4, florecruit: 4, usajobs: 5 };

function authorityScore(item) {
  let score = (ATS_AUTHORITY[item.ats] || 1) * 10;
  if (item.cycle && item.cycle !== "Internship" && item.cycle !== "New Grad") score += 6; // a known term beats an unknown one
  if (item.location) score += 3;
  if (/^https:/i.test(item.sourceUrl || "")) score += 2;
  score += Math.min(String(item.role || "").length, 60) / 60; // richer title breaks ties
  return score;
}

// workplaceType is a real structured field Ashby exposes ("Remote" / "Hybrid"
// / "OnSite") — not a guess, and more reliable than regexing the word
// "remote" out of a location string, which is the fallback every other ATS
// forces us to use because none of them expose it structurally.
// Coerce an ATS-supplied posting date (ISO string or epoch ms) into an ISO
// string, or null if it's missing / unparseable. This is the employer's OWN
// stated post date — distinct from firstSeen (when Promptly first observed it).
function toPostedIso(raw) {
  if (raw == null) return null;
  const t = typeof raw === "number" ? raw : Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  // Guard against absurd values (epoch 0, far future) that would skew the timeline.
  const year = new Date(t).getUTCFullYear();
  if (year < 2015 || year > new Date().getUTCFullYear() + 1) return null;
  return new Date(t).toISOString();
}

function normalize(src, title, url, location, cycle = "Summer 2027", workplaceType = null, postedAt = null) {
  const slug = src.board || src.tenant;
  const displayLocation = preferUsLocations(location);
  const remote = workplaceType ? workplaceType === "Remote" : /remote/i.test(String(location || ""));
  return {
    company: src.company,
    short: src.short,
    logoClass: src.logoClass,
    logo: `assets/logos/${slug}.png`, // shows if the file exists, else tile fallback
    field: src.field,
    subField: src.subField,
    role: cleanRole(title),
    program: cycle,
    cycle,
    deadline: "See posting",
    opened: displayLocation ? `Live • ${displayLocation.split(",")[0].trim()}` : "Live posting",
    location: displayLocation.slice(0, 120),
    remote,
    workplaceType: workplaceType || null,
    sourceLabel: `${src.company} – verified live posting`,
    sourceUrl: url,
    postedAt: toPostedIso(postedAt),
    live: true,
  };
}

const FETCHERS = {
  greenhouse: fetchGreenhouse,
  workday: fetchWorkday,
  lever: fetchLever,
  ashby: fetchAshby,
  smartrecruiters: fetchSmartRecruiters,
  florecruit: fetchFloRecruit,
  usajobs: fetchUsaJobs,
  taleo: fetchTaleo,
  custom: fetchCustom,
};

// Run a single source's real ATS fetcher. Used both by the aggregate loop and
// by the "watch" flow to probe that a pasted board actually resolves.
async function fetchOne(src) {
  return (FETCHERS[src.ats] || fetchGreenhouse)(src);
}

async function aggregateOpenings() {
  // Static curated registry + any user-watched boards. Watched sources feed
  // the exact same pipeline (dedupe, per-company cap, alerts), so watching is
  // real, not a promise. Loaded defensively — a Redis hiccup must never blank
  // the curated feed.
  let watched = [];
  try {
    const { listWatchedSources } = require("./watched-store");
    watched = await listWatchedSources();
  } catch {}
  const allSources = SOURCES.concat(Array.isArray(watched) ? watched : []);

  const results = await Promise.allSettled(
    allSources.map((src) => fetchOne(src))
  );

  // Keep the feed balanced and clean: no single employer floods it, and the
  // same role posted across multiple offices collapses to one card.
  const MAX_PER_COMPANY = 12;
  const perCompany = {};
  const sourceStatus = [];

  // Two-pass dedupe. The old loop kept whichever record arrived first, which
  // meant a Workday duplicate could beat the Greenhouse original purely on
  // ordering, and identical jobs slipped through whenever a URL carried a
  // tracking parameter or a title differed by a bracketed season.
  //
  // Pass 1 collects every candidate under two canonical keys; pass 2 keeps the
  // single most authoritative record per key (see authorityScore).
  const byUrl = new Map();   // canonical apply URL  → best record
  const byRole = new Map();  // company + role + cycle → best record
  const attributed = new Map();

  results.forEach((r, i) => {
    const src = allSources[i];
    if (r.status !== "fulfilled") {
      sourceStatus.push({ company: src.company, ats: src.ats, field: src.field, ok: false, error: String(r.reason).slice(0, 120) });
      return;
    }
    sourceStatus.push({ company: src.company, ats: src.ats, field: src.field, ok: true, count: r.value.length });

    for (const o of r.value) {
      if (!o.sourceUrl) continue;
      // Drop terms that have already finished, even though the req is still
      // published on the employer's board.
      if (isPastCycle(o.cycle)) continue;
      o.ats = src.ats;
      // Canonical form is the dedupe KEY only. The stored sourceUrl stays
      // exactly as the employer published it — normalising it (dropping "www.",
      // forcing https) changes the link a student actually clicks, and some
      // hosts reject the rewritten form.
      o.companyKey = normalizeCompany(o.company);
      o.roleKey = normalizeRole(o.role);

      const urlKey = canonicalUrl(o.sourceUrl);
      // Cycle is part of role identity: a Summer 2027 and a Fall 2026 posting
      // for the same title are genuinely different roles, not duplicates.
      const roleKey = `${o.companyKey}|${o.roleKey}|${o.cycle}`;

      const better = (existing) => !existing || authorityScore(o) > authorityScore(existing);
      if (better(byUrl.get(urlKey))) byUrl.set(urlKey, o);
      if (better(byRole.get(roleKey))) byRole.set(roleKey, o);
      attributed.set(o, src.company);
    }
  });

  // A record survives only if it won BOTH keys — that removes same-URL repeats
  // and same-role-different-URL repeats in one pass.
  const openings = [];
  const emitted = new Set();
  for (const candidate of byUrl.values()) {
    const roleKey = `${candidate.companyKey}|${candidate.roleKey}|${candidate.cycle}`;
    if (byRole.get(roleKey) !== candidate) continue;
    if (emitted.has(candidate)) continue;
    if ((perCompany[candidate.company] || 0) >= MAX_PER_COMPANY) continue;
    perCompany[candidate.company] = (perCompany[candidate.company] || 0) + 1;
    emitted.add(candidate);
    delete candidate.companyKey;
    delete candidate.roleKey;
    openings.push(candidate);
  }

  // Report what each source contributed AFTER dedupe, so a source that only
  // ever produces duplicates is visible instead of looking productive.
  const kept = {};
  openings.forEach((o) => { kept[o.company] = (kept[o.company] || 0) + 1; });
  sourceStatus.forEach((s) => { if (s.ok) s.count = kept[s.company] || 0; });

  return { openings, sourceStatus, updatedAt: new Date().toISOString() };
}

module.exports = { aggregateOpenings, isRelevant, detectCycle, fetchOne, isPastCycle, canonicalUrl, normalizeCompany, normalizeRole, preferUsLocations };

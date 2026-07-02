// ─────────────────────────────────────────────────────────────────────────
// Openings aggregator. Pulls live job reqs from each employer's ATS feed,
// keeps only real 2027 US summer internships, and normalizes them into the
// same shape the frontend uses. A posting is only kept if it is present in
// the employer's own live feed — that presence IS the verification, so dead
// or filled reqs drop out automatically on the next refresh.
// ─────────────────────────────────────────────────────────────────────────

const { SOURCES } = require("./sources");

const INTERNATIONAL = /london|hong ?kong|singapore|japan|munich|germany|india|toronto|calgary|montr|amsterdam|shanghai|sydney|paris|zurich|dublin|tokyo|seoul|\bhk\b|\buk\b|tel aviv|madrid|milan|frankfurt|warsaw|poland|bangalore|bengaluru|mumbai|manila|jakarta|shenzhen|beijing|dubai|abu dhabi|vancouver|berlin|stockholm|oslo|copenhagen|vienna|prague|budapest|geneva|brussels|edinburgh|manchester|glasgow|são paulo|sao paulo|mexico city|bogot/i;
// Seniority / staleness / non-student gate — keeps experienced roles, past
// cycles, and internal hiring roles out of BOTH the intern and new-grad paths.
// "recruiter/recruiting" excludes "Campus Recruiter"-type staff jobs that
// otherwise false-match on "early careers".
const EXCLUDE_TITLE = /experienced|senior|staff|principal|\blead\b|manager|director|\bvp\b|vice president|\bii+\b|\b[3-9]\+?\s*years|off[- ]?cycle|recruit(er|ing)|\b2023\b|\b2024\b|\b2025\b/i;
const INTERN_TITLE = /intern|summer analyst|co-?op/i;
const NEWGRAD_TITLE = /new\s?grad|university (graduate|hire)|recent graduate|early career|entry[ -]?level|campus hire|rotational program|analyst program/i;
const CYCLE_YEAR = /\b(2026|2027|2028)\b/;
const SEASON = /\b(spring|summer|fall|autumn|winter)\b/i;
// Not a real, student-relevant job req: talent pools, mailing lists, general
// "expression of interest" pages, and hourly production/technician roles that
// aren't the college-intern/new-grad audience.
const NON_ROLE = /mailing list|talent (community|network|pool)|future opportunit|join our|expression of interest|general application|prospective|production technician|assembly technician|\btemporary\b/i;

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Detect which recruiting cycle a posting belongs to, or null if it's not a
// student-relevant role. Internships require an explicit target year (keeps
// quality tight); new-grad/full-time entry roles are matched by explicit
// early-career markers. Pass allowUndatedIntern for feeds (e.g. USAJOBS)
// where a live listing is inherently current even without a year in the title.
function detectCycle(title, location, allowUndatedIntern = false) {
  if (!title) return null;
  // Check both title and location for international cues — some feeds put the
  // city in the title ("2026 Warsaw Data Internship") and leave location blank.
  if (INTERNATIONAL.test(`${title} ${location || ""}`)) return null; // US-focused audience
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
  if (NEWGRAD_TITLE.test(title)) {
    return yearMatch ? `New Grad ${yearMatch[1]}` : "New Grad";
  }
  return null;
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
    if (cycle) out.push(normalize(src, j.title, j.absolute_url, loc, cycle));
  }
  return out;
}

// ── Workday: public cxs jobs endpoint, paginated ─────────────────────────
async function fetchWorkday(src) {
  const base = `https://${src.tenant}.${src.dc}.myworkdayjobs.com`;
  const api = `${base}/wday/cxs/${src.tenant}/${src.site}/jobs`;
  const out = [];
  for (let offset = 0; offset < 200; offset += 20) {
    let data;
    try {
      data = await fetchJson(api, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: "2027 summer" }),
      });
    } catch {
      break;
    }
    const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
    if (!postings.length) break;
    for (const p of postings) {
      const cycle = detectCycle(p.title, p.locationsText);
      if (!cycle) continue;
      const url = `${base}/en-US/${src.site}${p.externalPath}`;
      out.push(normalize(src, p.title, url, p.locationsText, cycle));
    }
    if (postings.length < 20) break;
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
    if (cycle) out.push(normalize(src, j.text, j.hostedUrl, loc, cycle));
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
    if (cycle) out.push(normalize(src, j.title, j.jobUrl, j.location, cycle));
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
      out.push(normalize(src, p.name, `https://jobs.smartrecruiters.com/${src.board}/${p.id}`, location, cycle));
    }
    if (postings.length < 100) break;
  }
  return out;
}

// ── USAJOBS: official federal jobs API (all agencies at once) ─────────────
// { ats:"usajobs", field:"Government", query:"internship" }
// Requires a FREE API key: developer.usajobs.gov → set USAJOBS_API_KEY and
// USAJOBS_EMAIL in Vercel. Returns [] safely when unconfigured, so the build
// never breaks. Government intern titles rarely carry a cycle year, so this
// path intentionally does NOT apply the 2027 title rule — it filters by the
// student/intern hiring path instead. NOTE: not yet verifiable end-to-end
// without the key; shape follows the documented SearchResultItems schema.
const GOV_INCLUDE = /intern|pathways|fellow|student|recent graduate/i;
const GOV_EXCLUDE = /experienced|senior|supervisor|director/i;

async function fetchUsaJobs(src) {
  const key = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_EMAIL;
  if (!key || !email) return []; // unconfigured — no-op, never throws

  const query = encodeURIComponent(src.query || "internship");
  const res = await fetch(
    `https://data.usajobs.gov/api/search?Keyword=${query}&ResultsPerPage=250&WhoMayApply=student`,
    {
      headers: { Host: "data.usajobs.gov", "User-Agent": email, "Authorization-Key": key },
      signal: AbortSignal.timeout(12000),
    }
  );
  if (!res.ok) throw new Error(`${res.status} usajobs`);
  const data = await res.json();
  const items = data?.SearchResult?.SearchResultItems || [];
  const out = [];
  for (const it of items) {
    const d = it.MatchedObjectDescriptor || {};
    const title = d.PositionTitle || "";
    if (!GOV_INCLUDE.test(title) || GOV_EXCLUDE.test(title)) continue;
    const url = d.PositionURI || (d.ApplyURI && d.ApplyURI[0]);
    if (!url) continue;
    const location = d.PositionLocationDisplay || "";
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

function normalize(src, title, url, location, cycle = "Summer 2027") {
  const slug = src.board || src.tenant;
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
    opened: location ? `Live • ${String(location).split(",")[0].trim()}` : "Live posting",
    location: location ? String(location).replace(/\s+/g, " ").trim().slice(0, 120) : "",
    remote: /remote/i.test(String(location || "")),
    sourceLabel: `${src.company} – verified live posting`,
    sourceUrl: url,
    live: true,
  };
}

async function aggregateOpenings() {
  const fetchers = {
    greenhouse: fetchGreenhouse,
    workday: fetchWorkday,
    lever: fetchLever,
    ashby: fetchAshby,
    smartrecruiters: fetchSmartRecruiters,
    usajobs: fetchUsaJobs,
  };
  const results = await Promise.allSettled(
    SOURCES.map((src) => (fetchers[src.ats] || fetchGreenhouse)(src))
  );

  // Keep the feed balanced and clean: no single employer floods it, and the
  // same role posted across multiple offices collapses to one card.
  const MAX_PER_COMPANY = 12;
  const seen = new Set();            // dedupe by exact posting URL
  const seenRole = new Set();        // dedupe identical company+role+cycle
  const perCompany = {};
  const openings = [];
  const sourceStatus = [];

  results.forEach((r, i) => {
    const src = SOURCES[i];
    if (r.status === "fulfilled") {
      let added = 0;
      for (const o of r.value) {
        if (!o.sourceUrl || seen.has(o.sourceUrl)) continue;
        const roleKey = `${o.company}|${o.role}|${o.cycle}`.toLowerCase();
        if (seenRole.has(roleKey)) continue;                 // same role, another office
        if ((perCompany[o.company] || 0) >= MAX_PER_COMPANY) continue; // no flooding
        seen.add(o.sourceUrl);
        seenRole.add(roleKey);
        perCompany[o.company] = (perCompany[o.company] || 0) + 1;
        openings.push(o);
        added += 1;
      }
      sourceStatus.push({ company: src.company, ats: src.ats, ok: true, count: added });
    } else {
      sourceStatus.push({ company: src.company, ats: src.ats, ok: false, error: String(r.reason).slice(0, 120) });
    }
  });

  return { openings, sourceStatus, updatedAt: new Date().toISOString() };
}

module.exports = { aggregateOpenings, isRelevant, detectCycle };

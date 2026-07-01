// ─────────────────────────────────────────────────────────────────────────
// Openings aggregator. Pulls live job reqs from each employer's ATS feed,
// keeps only real 2027 US summer internships, and normalizes them into the
// same shape the frontend uses. A posting is only kept if it is present in
// the employer's own live feed — that presence IS the verification, so dead
// or filled reqs drop out automatically on the next refresh.
// ─────────────────────────────────────────────────────────────────────────

const { SOURCES } = require("./sources");

const INTERNATIONAL = /london|hong ?kong|singapore|japan|munich|germany|india|toronto|calgary|montr|amsterdam|shanghai|sydney|paris|zurich|dublin|tokyo|seoul|\bhk\b|\buk\b|tel aviv|madrid|milan|frankfurt/i;
const EXCLUDE_TITLE = /experienced|full[- ]?time|upcoming graduates|new analyst program|off[- ]?cycle|\b2024\b|\b2025\b|\b2026\b/i;
const INCLUDE_TITLE = /intern|summer|co-?op/i;

function isRelevant(title, location) {
  if (!title) return false;
  if (!/\b2027\b/.test(title)) return false;          // must be the 2027 cycle
  if (!INCLUDE_TITLE.test(title)) return false;        // must be an internship/summer role
  if (EXCLUDE_TITLE.test(title)) return false;         // not experienced / past cycles
  if (location && INTERNATIONAL.test(location)) return false; // US-focused audience
  return true;
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
  return jobs
    .filter((j) => isRelevant(j.title, (j.location || {}).name))
    .map((j) => normalize(src, j.title, j.absolute_url, (j.location || {}).name));
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
      if (!isRelevant(p.title, p.locationsText)) continue;
      const url = `${base}/en-US/${src.site}${p.externalPath}`;
      out.push(normalize(src, p.title, url, p.locationsText));
    }
    if (postings.length < 20) break;
  }
  return out;
}

// ── Lever: public postings API ───────────────────────────────────────────
async function fetchLever(src) {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${src.board}?mode=json`);
  const jobs = Array.isArray(data) ? data : [];
  return jobs
    .filter((j) => isRelevant(j.text, (j.categories || {}).location))
    .map((j) => normalize(src, j.text, j.hostedUrl, (j.categories || {}).location));
}

// ── Ashby: public posting-api, no auth ───────────────────────────────────
// { ats:"ashby", board:"<token>" } (jobs.ashbyhq.com/<token>)
async function fetchAshby(src) {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${src.board}`);
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return jobs
    .filter((j) => j.isListed !== false && isRelevant(j.title, j.location))
    .map((j) => normalize(src, j.title, j.jobUrl, j.location));
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
      if (!isRelevant(p.name, location)) continue;
      out.push(normalize(src, p.name, `https://jobs.smartrecruiters.com/${src.board}/${p.id}`, location));
    }
    if (postings.length < 100) break;
  }
  return out;
}

function normalize(src, title, url, location) {
  const slug = src.board || src.tenant;
  return {
    company: src.company,
    short: src.short,
    logoClass: src.logoClass,
    logo: `assets/logos/${slug}.png`, // shows if the file exists, else tile fallback
    field: src.field,
    subField: src.subField,
    role: cleanRole(title),
    program: "Summer 2027",
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
  };
  const results = await Promise.allSettled(
    SOURCES.map((src) => (fetchers[src.ats] || fetchGreenhouse)(src))
  );

  const seen = new Set();
  const openings = [];
  const sourceStatus = [];

  results.forEach((r, i) => {
    const src = SOURCES[i];
    if (r.status === "fulfilled") {
      let added = 0;
      for (const o of r.value) {
        if (!o.sourceUrl || seen.has(o.sourceUrl)) continue;
        seen.add(o.sourceUrl);
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

module.exports = { aggregateOpenings, isRelevant };

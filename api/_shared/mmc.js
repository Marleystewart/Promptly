// Marsh McLennan's businesses share ONE Workday board (mmc.wd1/MMC): Mercer,
// Oliver Wyman, NERA, Marsh, Marsh McLennan Agency and Guy Carpenter all post
// there, and the list reply names none of them. Adding the board as-is would
// file a Mercer actuarial internship under whichever card we happened to label
// it — the exact misattribution the Leidos/Kudu note in sources.js warns about.
//
// Each posting's DETAIL record does name the employer, as a legal entity:
//   hiringOrganization.name = "US063 Oliver Wyman, LLC"
//                             "US064 National Economic Research Associates, Inc."
//                             "US047 Mercer (US) LLC" …
// so this reads the list once, fetches details only for student-shaped titles,
// and routes each req to the business that is actually hiring.
//
// US-only by construction: the board's own Country facet is applied, because
// its locations carry no country ("Honolulu - 201 Merchant").

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const API = "https://mmc.wd1.myworkdayjobs.com/wday/cxs/mmc/MMC";
const PUBLIC = "https://mmc.wd1.myworkdayjobs.com/en-US/MMC";
const US_FACET = { Location_Country: ["bc33aa3152ec42d4995f4791a106ed09"] };
const TERMS = ["intern", "new grad", "college program", "summer analyst", "university graduate"];
const PAGES = 5;
const DETAIL_CONCURRENCY = 6;
// Cheap pre-filter so we only pay for detail fetches on plausible student
// roles. aggregator.js's detectCycle() still makes the real decision.
const STUDENT_SHAPED = /intern|summer|analyst|associate|graduate|college|campus|early career|entry[- ]level|new grad|co-?op|program/i;

// Business -> test on the legal entity (preferred) or the "Company:" line the
// description opens with. Lippincott is a business of Oliver Wyman and hires
// under Oliver Wyman, LLC, so it routes there.
const BRANDS = {
  oliverwyman: /oliver wyman|lippincott/i,
  nera: /national economic research|\bnera\b/i,
  mercer: /mercer/i,
  mma: /mclennan agency/i,
  guycarpenter: /guy carpenter/i,
  // Marsh the broker, and Marsh McLennan's corporate functions. Checked last:
  // "Marsh & McLennan Agency" must not land here.
  marsh: /\bmarsh\b/i,
};

function brandOf(...labels) {
  for (const label of labels) {
    if (!label) continue;
    for (const [brand, re] of Object.entries(BRANDS)) {
      if (re.test(label)) return brand;
    }
  }
  return null;
}

async function getJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Accept: "application/json", "User-Agent": UA, ...(options.headers || {}) },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} mmc`);
  return res.json();
}

async function listCandidates() {
  const seen = new Map();
  for (const searchText of TERMS) {
    for (let page = 0; page < PAGES; page += 1) {
      let data;
      try {
        data = await getJson(`${API}/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appliedFacets: US_FACET, limit: 20, offset: page * 20, searchText }),
        });
      } catch (error) {
        if (!seen.size && searchText === TERMS[0] && page === 0) throw error; // board down: report it
        break;
      }
      const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];
      for (const p of postings) {
        if (p.externalPath && STUDENT_SHAPED.test(p.title || "")) seen.set(p.externalPath, p);
      }
      if (postings.length < 20) break;
    }
  }
  return [...seen.values()];
}

// "Chicago - 155 Wacker" -> "Chicago". The street is office detail, not place.
function cleanLocation(text) {
  return String(text || "").replace(/\s+-\s+.*$/, "").trim();
}

async function readDetail(posting) {
  try {
    const d = await getJson(`${API}${posting.externalPath}`);
    const info = d.jobPostingInfo || {};
    const description = String(info.jobDescription || "").replace(/<[^>]+>/g, " ");
    const companyLine = (description.match(/Company:\s*([A-Za-z&,.' ]{2,60}?)(?:\s{2,}|Description|$)/) || [])[1];
    const brand = brandOf(d.hiringOrganization && d.hiringOrganization.name, companyLine);
    return {
      brand,
      title: String(posting.title || "").replace(/\s+/g, " ").trim(),
      url: `${PUBLIC}${posting.externalPath}`,
      location: cleanLocation(posting.locationsText),
      postedAt: info.startDate || null,
    };
  } catch {
    return null; // one unreadable detail must not sink the other businesses' roles
  }
}

async function loadAll() {
  const candidates = await listCandidates();
  const out = [];
  const queue = [...candidates];
  await Promise.all(Array.from({ length: DETAIL_CONCURRENCY }, async () => {
    while (queue.length) {
      const row = await readDetail(queue.shift());
      if (row && row.brand) out.push(row);
    }
  }));
  return out;
}

// Six registry rows read this board. Share one fetch per refresh rather than
// asking Workday six times; expire it so the next hourly run reads fresh.
const TTL_MS = 10 * 60 * 1000;
let cache = null;

function loadShared(now = Date.now()) {
  if (!cache || now - cache.at > TTL_MS) {
    const promise = loadAll();
    cache = { at: now, promise };
    promise.catch(() => { if (cache && cache.promise === promise) cache = null; });
  }
  return cache.promise;
}

async function fetchMmcBrand(brand) {
  if (!BRANDS[brand]) throw new Error(`unknown Marsh McLennan business "${brand}"`);
  const rows = await loadShared();
  return rows.filter((row) => row.brand === brand).map(({ brand: _b, ...row }) => row);
}

module.exports = { fetchMmcBrand, brandOf, cleanLocation, _resetCache: () => { cache = null; } };

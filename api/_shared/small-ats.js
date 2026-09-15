// Small applicant-tracking systems with public job feeds.
//
// Mid-size consultancies on Trey's list hire through systems too small to earn
// a module each: Workable, UKG (UltiPro), ADP Workforce Now, Paylocity,
// Pinpoint, Recruitee, Jobvite, Rippling, Teamtailor, Breezy and BambooHR.
// Every one publishes the list its own careers page renders, and every one
// answers a plain server fetch with no token. Each reader below returns
//
//   { title, url, location, postedAt, us }
//
// where `us` comes from the feed's STRUCTURED country field wherever one
// exists (Workable "United States", UKG "USA", Recruitee "US"…). That matters:
// these firms are often global (Control Risks, dss+, Anthesis) and a text test
// on "City, ST" is exactly what reads "Toronto, ON, CA" as California. Where a
// feed has no country field (Jobvite, some ADP reqs), the shared positive
// test in us-location.js decides, which drops anything it cannot place.
//
// aggregator.js keeps only us === true, then applies detectCycle as usual.

const { isUsLocation } = require("./us-location");

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const TIMEOUT = 15000;

async function getText(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "User-Agent": UA, Accept: "application/json, text/html;q=0.9, */*;q=0.8", ...(options.headers || {}) },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`${res.status} ${new URL(url).hostname}`);
  return res.text();
}
const getJson = async (url, options) => JSON.parse(await getText(url, options));

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const join = (...parts) => parts.map(clean).filter(Boolean).join(", ");
const US_NAME = /^(united states(?: of america)?|usa?)$/i;

// ── Workable: widget API — apply.workable.com/<account> ─────────────────────
async function workable(account) {
  const data = await getJson(`https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(account)}`);
  return (data.jobs || []).map((job) => ({
    title: clean(job.title),
    url: job.url || `https://apply.workable.com/${account}/j/${job.shortcode}/`,
    location: join(job.city, job.state, job.country),
    postedAt: job.published_on || job.created_at || null,
    us: US_NAME.test(clean(job.country)),
  }));
}

// ── UKG / UltiPro: board = "<host>/<TENANT>/<board guid>" ────────────────────
// e.g. recruiting.ultipro.com/SCO1003/22ca7f41-… (also recruiting2.ultipro.com
// and <x>.rec.pro.ukg.net). The job board page POSTs LoadSearchResults.
async function ukg(board) {
  const [host, tenant, guid] = String(board).split("/");
  const base = `https://${host}/${tenant}/JobBoard/${guid}`;
  const out = [];
  for (let skip = 0; skip < 300; skip += 100) {
    const data = await getJson(`${base}/JobBoardView/LoadSearchResults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunitySearch: { Top: 100, Skip: skip, QueryString: "", OrderBy: [{ Value: "postedDateDesc", PropertyName: "PostedDate", Ascending: false }], Filters: [] },
        matchCriteria: { PreferredJobs: [], Educations: [], LicenseAndCertifications: [], Skills: [], hasNoLicenses: false, SkippedSkills: [] },
      }),
    });
    const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
    for (const o of opportunities) {
      const addresses = (o.Locations || []).map((l) => l.Address || {});
      const usAddresses = addresses.filter((a) => a.Country && a.Country.Code === "USA");
      const shown = (usAddresses.length ? usAddresses : addresses)
        .map((a) => join(a.City, a.State && a.State.Code, a.Country && a.Country.Code === "USA" ? "United States" : a.Country && a.Country.Name))
        .filter(Boolean);
      out.push({
        title: clean(o.Title),
        url: `${base}/OpportunityDetail?opportunityId=${encodeURIComponent(o.Id)}`,
        location: shown.join("; "),
        postedAt: o.PostedDate || null,
        us: usAddresses.length > 0,
      });
    }
    if (opportunities.length < 100 || out.length >= (Number(data.totalCount) || 0)) break;
  }
  return out;
}

// ── Paylocity: board = job-board guid ────────────────────────────────────────
// The public board serialises every job into window.pageData.
async function paylocity(guid) {
  const html = await getText(`https://recruiting.paylocity.com/recruiting/jobs/All/${guid}`);
  const match = html.match(/window\.pageData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
  if (!match) throw new Error("paylocity: no pageData");
  const jobs = JSON.parse(match[1]).Jobs || [];
  return jobs.map((job) => {
    const where = job.JobLocation || {};
    return {
      title: clean(job.JobTitle),
      url: `https://recruiting.paylocity.com/Recruiting/Jobs/Details/${job.JobId}`,
      // LocationName is the employer's label ("WDC", "Remote - US only");
      // the structured city/state is more useful when present.
      location: join(where.City, where.State) || clean(job.LocationName),
      postedAt: job.PublishedDate || null,
      us: String(where.Country || "").toUpperCase() === "USA",
    };
  });
}

// ── Pinpoint: board = subdomain ─────────────────────────────────────────────
// location.name is "Country - City" ("United States - New York", "Spain - Manlleu").
async function pinpoint(sub) {
  const data = await getJson(`https://${sub}.pinpointhq.com/postings.json`);
  return (data.data || []).map((job) => {
    const name = clean((job.location || {}).name);
    const [country, ...rest] = name.split(/\s+-\s+/);
    return {
      title: clean(job.title),
      url: job.url,
      location: rest.length ? join(rest.join(" - "), country) : name,
      postedAt: job.created_at || null,
      us: US_NAME.test(country || ""),
    };
  });
}

// ── Recruitee: board = subdomain ────────────────────────────────────────────
async function recruitee(sub) {
  const data = await getJson(`https://${sub}.recruitee.com/api/offers/`);
  return (data.offers || []).map((offer) => ({
    title: clean(offer.title),
    url: offer.careers_url,
    location: join(offer.city, offer.state_code, offer.country_code === "US" ? "United States" : offer.country),
    postedAt: offer.published_at || null,
    us: offer.country_code === "US",
  }));
}

// ── Jobvite: board = company slug (jobs.jobvite.com/<slug>/jobs) ────────────
// Server-rendered table; no country field, so the positive text test decides.
async function jobvite(slug) {
  const html = await getText(`https://jobs.jobvite.com/${slug}/jobs`);
  const rows = [...html.matchAll(/<td class="jv-job-list-name">\s*<a href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<td class="jv-job-list-location">([\s\S]*?)<\/td>/g)];
  return rows.map(([, href, title, location]) => {
    const loc = clean(location);
    return {
      title: clean(title),
      url: href.startsWith("http") ? href : `https://jobs.jobvite.com${href}`,
      location: loc,
      postedAt: null,
      us: isUsLocation(loc),
    };
  });
}

// ── Rippling: board = board slug (ats.rippling.com/<slug>) ──────────────────
async function rippling(slug) {
  const data = await getJson(`https://ats.rippling.com/api/v2/board/${slug}/jobs`);
  return (data.items || []).map((job) => {
    const locations = job.locations || [];
    const usLocations = locations.filter((l) => US_NAME.test(clean(l.country)));
    return {
      title: clean(job.name),
      url: job.url,
      location: (usLocations.length ? usLocations : locations).map((l) => clean(l.name)).join("; "),
      postedAt: null,
      us: usLocations.length > 0,
    };
  });
}

// ── Breezy HR: board = subdomain ────────────────────────────────────────────
async function breezy(sub) {
  const data = await getJson(`https://${sub}.breezy.hr/json`);
  return (Array.isArray(data) ? data : []).map((job) => {
    const where = job.location || {};
    const country = (where.country || {}).id;
    return {
      title: clean(job.name),
      url: job.url,
      location: join(where.city, (where.state || {}).id, country === "US" ? "United States" : (where.country || {}).name),
      postedAt: job.published_date || null,
      us: country === "US",
    };
  });
}

// ── BambooHR: board = subdomain ─────────────────────────────────────────────
async function bamboohr(sub) {
  const data = await getJson(`https://${sub}.bamboohr.com/careers/list`);
  return (data.result || []).map((job) => {
    const ats = job.atsLocation || {};
    const loc = job.location || {};
    const country = clean(ats.country || loc.country);
    const location = join(ats.city || loc.city, ats.state || loc.state, country);
    return {
      title: clean(job.jobOpeningName),
      url: `https://${sub}.bamboohr.com/careers/${job.id}`,
      location,
      postedAt: null,
      us: country ? US_NAME.test(country) : isUsLocation(location),
    };
  });
}

// ── ADP Workforce Now: board = career-center cid (a guid) ───────────────────
// The address rarely carries a country; the location's shortName does
// (" New York, NY, US"), so the country is its last segment. The public job
// link uses the ExternalJobID custom field, not itemID.
async function adp(cid) {
  const url = "https://workforcenow.adp.com/mascsr/default/careercenter/public/events/staffing/v1/job-requisitions"
    + `?cid=${encodeURIComponent(cid)}&timeStamp=${Date.now()}&lang=en_US&locale=en_US&$top=100`;
  const data = await getJson(url);
  return (data.jobRequisitions || []).map((req) => {
    const strings = ((req.customFieldGroup || {}).stringFields || []);
    const externalId = (strings.find((f) => (f.nameCode || {}).codeValue === "ExternalJobID") || {}).stringValue;
    const locations = (req.requisitionLocations || []).map((l) => {
      const label = clean((l.nameCode || {}).shortName);
      const a = l.address || {};
      const country = (a.country || {}).codeValue || (label.split(",").pop() || "").trim();
      return { text: join(a.cityName, (a.countrySubdivisionLevel1 || {}).codeValue) || label, country };
    });
    const usLocations = locations.filter((l) => /^(US|USA)$/i.test(l.country));
    return {
      title: clean(req.requisitionTitle),
      url: `https://workforcenow.adp.com/mascsr/default/mdf/recruitment/recruitment.html?cid=${encodeURIComponent(cid)}`
        + `&jobId=${encodeURIComponent(externalId || req.itemID)}&lang=en_US`,
      location: (usLocations.length ? usLocations : locations).map((l) => l.text).join("; "),
      postedAt: req.postDate || null,
      us: usLocations.length > 0 || (!locations.some((l) => l.country) && locations.some((l) => isUsLocation(l.text))),
    };
  });
}

// ── Teamtailor: board = career-site host (hka.teamtailor.com) ───────────────
// Every Teamtailor site publishes /jobs.rss with structured tt:location nodes.
async function teamtailor(host) {
  const xml = await getText(`https://${host}/jobs.rss`);
  return xml.split("<item>").slice(1).map((item) => {
    const tag = (name) => (item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)) || [])[1] || "";
    const places = [...item.matchAll(/<tt:location>([\s\S]*?)<\/tt:location>/g)].map(([, block]) => ({
      city: clean((block.match(/<tt:city>([\s\S]*?)<\/tt:city>/) || [])[1]),
      country: clean((block.match(/<tt:country>([\s\S]*?)<\/tt:country>/) || [])[1]),
    }));
    const usPlaces = places.filter((p) => US_NAME.test(p.country));
    const posted = Date.parse(clean(tag("pubDate")));
    return {
      title: clean(tag("title")),
      url: clean(tag("link")),
      location: (usPlaces.length ? usPlaces : places).map((p) => join(p.city, p.country)).join("; "),
      postedAt: Number.isFinite(posted) ? new Date(posted).toISOString() : null,
      us: usPlaces.length > 0,
    };
  });
}

// ── JazzHR: board = subdomain (<sub>.applytojob.com/apply) ──────────────────
// Server-rendered list; the location is the map-marker line ("New York, NY")
// with no country field, so the positive text test decides.
async function jazzhr(sub) {
  const html = await getText(`https://${sub}.applytojob.com/apply`);
  const items = html.split(/<li class="list-group-item">/).slice(1);
  return items.map((item) => {
    const link = item.match(/<a href="(https:\/\/[^"]+\/apply\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!link) return null;
    const loc = clean((item.match(/fa-map-marker[^>]*><\/i>([\s\S]*?)<\/li>/) || [])[1]);
    return { title: clean(link[2]), url: link[1], location: loc, postedAt: null, us: isUsLocation(loc) };
  }).filter(Boolean);
}

// ── ClearCompany public board: board = subdomain (<sub>.hrmdirect.com) ──────
// Server-rendered table; columns vary by employer (RSG: City/State/Office;
// BTS: practice + a location column). Each row is a <tr class="reqitem…">
// with a posTitle link. Location = city+state, else office, else the custom
// column that reads as a place; US-ness from the shared positive test.
function parseHrmdirectRows(html, sub) {
  return String(html).split(/<tr class="reqitem/).slice(1).map((row) => {
    const cell = (cls) => clean((row.match(new RegExp(`class=.${cls}[^>]*>([\\s\\S]*?)</td>`)) || [])[1]);
    const link = row.match(/class=.posTitle[^>]*><a href="([^"]+)"[^>]*>([\s\S]*?)<\/(?:a|td)>/);
    if (!link) return null;
    const custom = [cell("custSort1"), cell("custSort2"), cell("custSort3")].find((v) => /,|remote/i.test(v)) || "";
    const location = join(cell("cities"), cell("state")) || cell("offices") || custom;
    return {
      title: clean(link[2]),
      url: `https://${sub}.hrmdirect.com/employment/${clean(link[1]).replace(/&&/g, "&").replace(/#job$/, "")}`,
      location,
      postedAt: null,
      us: isUsLocation(location),
    };
  }).filter(Boolean);
}
async function hrmdirect(sub) {
  return parseHrmdirectRows(await getText(`https://${sub}.hrmdirect.com/employment/job-openings.php?search=true`), sub);
}

// ── HiBob: board = subdomain (<sub>.careers.hibob.com) ─────────────────────
// The careers page reads /api/job-ad and names its tenant in a
// "companyidentifier" header; without it the route answers 401. Country is a
// structured field ("United States").
async function hibob(sub) {
  const data = await getJson(`https://${sub}.careers.hibob.com/api/job-ad`, { headers: { companyidentifier: sub } });
  return (data.jobAdDetails || []).map((ad) => ({
    title: clean(ad.title),
    url: `https://${sub}.careers.hibob.com/jobs/${ad.id}`,
    location: join(ad.site, ad.country),
    postedAt: ad.publishedAt || null,
    us: US_NAME.test(clean(ad.country)),
  }));
}

const READERS = { workable, ukg, adp, paylocity, pinpoint, recruitee, jobvite, rippling, teamtailor, breezy, bamboohr, jazzhr, hrmdirect, hibob };

async function fetchSmallAtsListings(ats, board) {
  const reader = READERS[ats];
  if (!reader) throw new Error(`small-ats: no reader for "${ats}"`);
  return reader(board);
}

module.exports = { fetchSmallAtsListings, SMALL_ATS: Object.keys(READERS), READERS, clean, parseHrmdirectRows };

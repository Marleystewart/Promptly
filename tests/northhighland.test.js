// North Highland's SourceFlow board (api/_shared/company-scrapers/northhighland.js).
//
// Two things must hold. US-ness comes from the structured postal address
// (region_code), not the free-text "Salem, Oregon" — North Highland also hires
// in the UK, and a UK row carries a perfectly readable city name too. And the
// request must be the POST shape the route permits: `job_search` is required
// and non-empty, and `query`/`offset` are the only parameters it accepts, so a
// reader that invents `limit` gets a 400 and the board reads as dead.

const assert = require("node:assert/strict");
const fetchNorthHighland = require("../api/_shared/company-scrapers/northhighland.js");

const realFetch = global.fetch;
const asked = [];

function job(slug, title, region, area, locality) {
  return {
    job: {
      id: slug, url_slug: slug, title, published_at: 1789572198,
      addresses: [`${locality}, ${area}`],
      derived_info: { locations: [{ postal_address: { region_code: region, administrative_area: area, locality } }] },
    },
  };
}

global.fetch = async (url, options = {}) => {
  asked.push({ url: String(url), method: options.method, body: options.body });
  const offset = JSON.parse(options.body).job_search.offset;
  // A full page is ten, which is what makes the reader ask for the next one.
  const results = offset === 0
    ? [job("a-1", "Analyst, Advanced Analytics", "US", "TX", "Dallas"),
       job("b-2", "Consultant", "GB", "England", "London"),
       ...Array.from({ length: 8 }, (_, i) => job(`f-${i}`, `Filler ${i}`, "US", "NY", "New York"))]
    : [job("c-3", "Summer Intern 2027", "US", "GA", "Atlanta")];
  return { ok: true, status: 200, json: async () => ({ total_size: 11, results }) };
};

(async () => {
  try {
    const rows = await fetchNorthHighland();

    assert.equal(rows.length, 10, "ten of the eleven are US; the London req is dropped");
    assert.ok(!rows.some((r) => r.title === "Consultant"),
      "the London req must be dropped by region_code, not kept because its city reads cleanly");
    assert.equal(rows[rows.length - 1].title, "Summer Intern 2027", "the second page must be read");
    assert.equal(rows[0].location, "Dallas, TX", "the structured address gives a state code, not \"Dallas, Texas\"");
    assert.equal(rows[0].url, "https://careers.northhighland.com/jobs/a-1");
    assert.equal(rows[0].postedAt.slice(0, 10), "2026-09-16", "published_at is unix seconds");

    assert.equal(asked[0].method, "POST", "the route is POST-only; a GET answers 401 and looks like an auth wall");
    const sent = JSON.parse(asked[0].body);
    assert.deepEqual(Object.keys(sent), ["job_search"]);
    assert.deepEqual(Object.keys(sent.job_search).sort(), ["offset", "query"],
      "query and offset are the only parameters the route permits");
    assert.equal(JSON.parse(asked[1].body).job_search.offset, 10, "paging is by offset, ten at a time");

    console.log("North Highland tests passed. region_code decides US, and the POST shape is the permitted one.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

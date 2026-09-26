// Lockton's Algolia-backed board (api/_shared/company-scrapers/lockton.js).
// Payload shape trimmed from the live index on 16 Sep 2026.
//
// Two things must hold. US-ness comes from the record's structured `country`,
// because Lockton hires in the UK and Australia and a bare city name would not
// separate them. And the card's location must read "City, State": the index
// stores it the other way round ("Missouri, St. Louis"), which shown raw would
// tell a student the job is in Missouri, St. Louis.

const assert = require("node:assert/strict");
const fetchLockton = require("../api/_shared/company-scrapers/lockton.js");

const realFetch = global.fetch;
let seen = null;
global.fetch = async (url, options = {}) => {
  seen = { url: String(url), options };
  return {
    ok: true,
    status: 200,
    json: async () => ({
      hits: [
        { jobTitle: "People Solutions Intern - June 2027", referenceID: "2601IW", country: "United States of America", city: "St. Louis", location: ["Missouri, St. Louis"] },
        { jobTitle: "Reinsurance Broker Intern", referenceID: "2601HX", country: "United States of America", city: "New York City", location: ["New York, New York City", "Illinois, Chicago"] },
        { jobTitle: "Graduate Broker", referenceID: "2601GB", country: "United Kingdom", city: "London", location: ["England, London"] },
        { jobTitle: "No Reference", referenceID: "", country: "United States of America", city: "Denver", location: ["Colorado, Denver"] },
      ],
    }),
  };
};

(async () => {
  try {
    const rows = await fetchLockton();

    assert.deepEqual(rows.map((r) => r.title), ["People Solutions Intern - June 2027", "Reinsurance Broker Intern"],
      "the UK role must be dropped by the structured country, and a row with no reference has no link to give");
    assert.equal(rows[0].location, "St. Louis, Missouri", '"Missouri, St. Louis" must be shown the way a student reads an address');
    assert.equal(rows[1].location, "New York City, New York; Chicago, Illinois");
    assert.equal(rows[0].url, "https://careers.lockton.com/jobid/2601iw", "job links are the lowercased reference id");

    // The request must carry the page's own published search key, not a guess.
    assert.match(seen.url, /^https:\/\/97erbym9h9-dsn\.algolia\.net\/1\/indexes\/prod_contentful_job\/query$/);
    assert.equal(seen.options.headers["X-Algolia-Application-Id"], "97ERBYM9H9");

    console.log("Lockton tests passed. Country decides US, and locations read City, State.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

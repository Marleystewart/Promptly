// KPMG US (api/_shared/company-scrapers/kpmg.js).
//
// Each row is rendered twice. The grid card says "9 Locations"; the list line
// says "Advisory | Austin, TX; Boston, MA". Only the second is useful to a
// student, so the reader must take the LAST location cell and drop the
// practice-area prefix — taking the first gives a card that names no city.
//
// The board pages by keyword only, so the reader must union several terms; one
// request would cap the whole firm at 12 rows.

const assert = require("node:assert/strict");
const fetchKpmg = require("../api/_shared/company-scrapers/kpmg.js");

const realFetch = global.fetch;
const asked = [];

const ROW = `<div class="search--item mb-2 search--early-career ">
  <a href="/jobdetail/?jobId=134771" class="box-shadow d-block">
    <div class="grid-view">
      <div class="px-3 py-1 eyebrow bg-search eyebrow text-white">Early Career</div>
      <div class="h4 mb-4">Audit Intern | Multiple Locations Summer 2027</div>
      <div class="text-xs text-dark-grey">9 Locations</div>
    </div>
    <div class="list-view">
      <div class="h5 text-dark-grey">Audit Intern | Multiple Locations Summer 2027</div>
      <div class="text-xs text-dark-grey">Audit &amp; Assurance | Austin, TX; Boston, MA</div>
    </div>
  </a>
</div>`;

global.fetch = async (url) => {
  asked.push(String(url));
  return { ok: true, status: 200, text: async () => ROW };
};

(async () => {
  try {
    const rows = await fetchKpmg();

    assert.equal(rows.length, 1, "the same req seen under several keywords is one row");
    assert.equal(rows[0].location, "Austin, TX; Boston, MA",
      'the list view\'s offices must win over the grid\'s "9 Locations", and the practice area must be dropped');
    assert.equal(rows[0].title, "Audit Intern | Multiple Locations Summer 2027");
    assert.equal(rows[0].url, "https://www.kpmguscareers.com/jobdetail/?jobId=134771");

    assert.ok(asked.length > 1, "the board pages by keyword only, so one request cannot be the whole read");
    for (const url of asked) assert.match(url, /[?&]keyword=/, "every request must carry a keyword");

    console.log("KPMG tests passed. The list view's offices win, and the read is a keyword union.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

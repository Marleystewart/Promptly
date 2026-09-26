// Deloitte US (api/_shared/company-scrapers/deloitte.js).
//
// The board is only affordable because of one thing: the request must carry
// the Hire Type facet (field 9339 = campus + intern), which turns thousands of
// reqs into ~140. Without it the scraper would try to walk the whole firm, so
// the facet is asserted here rather than left as a comment.
//
// The other trap is the location column. A Deloitte campus req covers many US
// offices and says "Multiple Locations"; the site is the /en_US Deloitte US
// portal, so those rows ARE US and must survive. A per-row US text test would
// silently drop most of Deloitte's student hiring.

const assert = require("node:assert/strict");
const fetchDeloitte = require("../api/_shared/company-scrapers/deloitte.js");

const realFetch = global.fetch;
const asked = [];

function row(title, id, location) {
  return `<article class="article--result " data-total="12">
    <h3 class="article__header__text__title"><a href="https://apply.deloitte.com/en_US/careers/JobDetail/${id}/${id}" class="link">${title}</a></h3>
    <div class="article__header__text__subtitle"><span>Deloitte US</span>|<span>Deloitte Tax LLP</span>|<span>${location}</span></div>
  </article>`;
}

global.fetch = async (url) => {
  asked.push(String(url));
  const offset = Number((String(url).match(/jobOffset=(\d+)/) || [])[1] || 0);
  const body = offset === 0
    ? row("Tax - Tax Intern - Business - Summer 2027", "a1", "Multiple Locations") + row("Audit &amp; Assurance &#8211; Intern", "a2", "Atlanta, Georgia, United States")
    : row("Consultative Offerings - Summer Scholar", "b1", "Multiple Locations");
  return { ok: true, status: 200, text: async () => body };
};

(async () => {
  try {
    const rows = await fetchDeloitte();

    assert.match(asked[0], /[?&]9339=477,478(&|$)/, "every request must carry the student Hire Type facet, or this walks the whole firm");
    assert.deepEqual(rows.map((r) => r.location), ["Multiple Locations", "Atlanta, Georgia, United States", "Multiple Locations"],
      '"Multiple Locations" is a US campus req on the US portal and must not be dropped');
    assert.equal(rows[1].title, "Audit & Assurance – Intern", "entities in the title must be decoded");
    assert.equal(rows[0].url, "https://apply.deloitte.com/en_US/careers/JobDetail/a1/a1");

    // data-total 12 over 10 per page means exactly one extra page, fetched once.
    const offsets = asked.map((u) => (u.match(/jobOffset=(\d+)/) || [])[1]);
    assert.deepEqual(offsets, ["0", "10"], "paging must follow the reported total, not guess");

    console.log("Deloitte tests passed. The student facet is sent, and Multiple Locations survives.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

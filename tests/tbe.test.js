// Taleo Business Edition (api/_shared/tbe.js).
//
// The whole reason this board was recorded as unreadable: asking
// /searchResults directly returns the search FORM — 200, ~98KB of it, no rows
// and no error. It only returns rows once you carry the JSESSIONID that
// /jobSearch hands out. A reader that skips step one looks like it is working
// and reports an employer with no openings, for ever.
//
// So the test pins the order and the cookie, not just the parsing.

const assert = require("node:assert/strict");
const { fetchTbeListings, parseRows } = require("../api/_shared/tbe.js");

const realFetch = global.fetch;
const asked = [];

const row = (rid, title, location) => `
  <div class="oracletaleocwsv2-accordion-head-info">
    <h4 class="oracletaleocwsv2-head-title">
      <a href="https://phg.tbe.taleo.net/phg02/ats/careers/v2/viewRequisition?org=CENTCONS&amp;cws=38&amp;rid=${rid}" class="viewJobLink">${title}</a>
    </h4>
    <div tabindex="0" >${location}</div>
  </div>`;

global.fetch = async (url, options = {}) => {
  const u = String(url);
  asked.push({ url: u, cookie: options.headers?.cookie });
  if (u.includes("/jobSearch")) {
    return {
      ok: true, status: 200,
      headers: { getSetCookie: () => ["JSESSIONID=ABC123; Path=/; HttpOnly"] },
      text: async () => "<html>the search form, no rows</html>",
    };
  }
  // Results only exist for a caller carrying the session.
  if (!options.headers?.cookie) {
    return { ok: true, status: 200, headers: { getSetCookie: () => [] }, text: async () => "<html>the search form again</html>" };
  }
  const from = Number((u.match(/rowFrom=(\d+)/) || [])[1] || 0);
  const body = from === 0
    ? Array.from({ length: 10 }, (_, i) => row(6900 + i, `Consultant ${i}`, "Columbus")).join("")
    : row(7000, "Summer Intern 2027", "Chicago");
  return { ok: true, status: 200, headers: { getSetCookie: () => [] }, text: async () => `<html>${body}</html>` };
};

(async () => {
  try {
    const rows = await fetchTbeListings("phg02/CENTCONS/38");

    // Order and session
    assert.match(asked[0].url, /\/jobSearch\?org=CENTCONS&cws=38$/,
      "the first request must be /jobSearch — it exists only to be issued a session");
    assert.equal(asked[0].cookie, undefined, "nothing to send on the first request");
    assert.match(asked[1].url, /\/searchResults\?org=CENTCONS&cws=38$/);
    assert.equal(asked[1].cookie, "JSESSIONID=ABC123",
      "the results request must carry the cookie /jobSearch set, or it silently returns the form");

    // Paging
    assert.match(asked[2].url, /rowFrom=10/, "a full page of ten must be followed by rowFrom=10");
    assert.equal(rows.length, 11, "both pages are kept");
    assert.equal(rows[10].title, "Summer Intern 2027", "the second page's row must survive");

    // Title and location come from one block, paired, not two separate scans.
    assert.equal(rows[0].location, "Columbus");
    assert.equal(rows[10].location, "Chicago");
    assert.equal(rows[0].url, "https://phg.tbe.taleo.net/phg02/ats/careers/v2/viewRequisition?org=CENTCONS&cws=38&rid=6900",
      "the &amp; in the href must be decoded or the link 404s");

    // A malformed board must fail loudly rather than fetch nothing.
    await assert.rejects(() => fetchTbeListings("CENTCONS"), /board must be/,
      "a board without segment/org/cws is a configuration error, not an empty employer");

    // Parser alone: a row whose title is empty is not a job.
    assert.equal(parseRows(row(1, "", "Columbus"), "https://x").length, 0);

    console.log("Taleo Business Edition tests passed. Session first, then results, then rowFrom.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

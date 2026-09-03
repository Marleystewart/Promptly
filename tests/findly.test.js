// Findly-hosted sites 404 on every obvious search path while serving a large
// single-page app, so they read as unreachable from the outside. They are not:
// the page calls a JSON API on m-cloud.io that answers a plain Node fetch. The
// only way to find it was to watch the rendered page's own requests.
//
// Findly runs TWO backends and a tenant uses one or the other, so the adapter
// has to be told which. Getting that wrong is silent, not loud.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { normalize, usFindlyOnly } = require("../api/_shared/findly");

// Country is reported directly, so US filtering is exact here — none of the
// IN/Indiana ambiguity that forced a position-aware test for jobs2web.
{
  const us = normalize({ title: "Surgical Technology Intern", primary_city: "Cleveland", primary_state: "OH", primary_country: "US", url: "https://x/1" });
  assert.equal(us.location, "Cleveland, OH, US");
  assert.equal(us.country, "US");

  const foreign = normalize({ title: "Category Director", primary_city: "Istanbul", primary_country: "TR", url: "https://x/2" });
  assert.equal(foreign.country, "TR");

  assert.equal(normalize({ primary_country: "US" }), null, "a row with no title is not a job");

  const kept = usFindlyOnly([us, foreign]);
  assert.equal(kept.length, 1, "only the US row survives");
  assert.equal(kept[0].country, "US");
}

// Both backends must stay wired, and each scraper must name the right one.
{
  const src = fs.readFileSync(path.join(__dirname, "..", "api/_shared/findly.js"), "utf8");
  assert.match(src, /jobsapi-internal\.m-cloud\.io\/api\/job/, "internal backend");
  assert.match(src, /jobsapi-google\.m-cloud\.io\/api\/job\/search/, "google backend");
  // SearchText is the ONLY parameter the internal backend honours. Keyword, q,
  // Search and Query are all accepted and silently ignored, returning the full
  // unfiltered list — which looks like a working search that found everything.
  assert.match(src, /SearchText/, "the internal backend filters on SearchText, nothing else");

  const coke = fs.readFileSync(path.join(__dirname, "..", "api/_shared/company-scrapers/cocacola.js"), "utf8");
  assert.match(coke, /backend: "internal"/);
  assert.match(coke, /organization: 2110/);

  const ccf = fs.readFileSync(path.join(__dirname, "..", "api/_shared/company-scrapers/clevelandclinic.js"), "utf8");
  assert.match(ccf, /backend: "google"/);
  assert.match(ccf, /companyUuid: "ed426cce-a5ac-48b0-ba13-35fa552c0bd9"/);
}

console.log("Findly tests passed. Country is exact; both backends are wired.");

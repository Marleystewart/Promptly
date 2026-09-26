// Three boards that every earlier sweep recorded as "no job board found",
// because each one is the employer's OWN page rather than a named ATS:
//
//   Kittelson & Associates  WordPress articles, offices in separate <span>s
//   Boston Strategic Partners  WordPress posts, every opening linked twice
//   Synapse Energy Economics  Trakstar Hire (ex-Recruiterbox) RSS feed
//
// Each has a parse that fails quietly if the markup shifts — offices run
// together into "BendBoiseMiami", every title replaced by "Read More »", a
// location with no spaces that the US test cannot read. Those are what this
// pins.

const assert = require("node:assert/strict");
const { parseOpenings: parseKittelson } = require("../api/_shared/company-scrapers/kittelson.js");
const { parseOpenings: parseBsp } = require("../api/_shared/company-scrapers/bostonsp.js");
const { parseFeed, parseLocation } = require("../api/_shared/trakstar.js");
const { isUsLocation } = require("../api/_shared/us-location.js");

// ── Kittelson ──────────────────────────────────────────────────────────────
const kittelsonHtml = `
<article id="post-1" class="medium-12 columns article--detail tag--intern">
  <div class="medium-3 columns"><a href="https://www.kittelson.com/careers/ti/"><h3>Transportation Engineering and Planning Intern (Summer 2027)</h3></a></div>
  <div class="medium-2 columns"><h4><i class="m-only">Years of Experience: </i><span>0-3</span></h4></div>
  <div class="medium-3 columns"><h4><i class="m-only">Office: </i> All </h4></div>
</article>
<article id="post-2" class="medium-12 columns article--detail">
  <div class="medium-3 columns"><a href="https://www.kittelson.com/careers/ta/"><h3>Transportation Analyst</h3></a></div>
  <div class="medium-3 columns"><h4><i class="m-only">Office: </i><span>Bend</span><span>Boise</span><span>Miami</span></h4></div>
</article>
<article id="post-3" class="medium-12 columns article--detail">
  <div class="medium-3 columns"><a href="https://www.kittelson.com/careers/gd/"><h3>Graphic Design &#038; Cartography Intern (Summer 2027)</h3></a></div>
  <div class="medium-3 columns"><h4><i class="m-only">Office: </i><span>Orlando</span></h4></div>
</article>`;

{
  const rows = parseKittelson(kittelsonHtml);
  assert.equal(rows.length, 3);
  assert.equal(rows[1].location, "Bend; Boise; Miami",
    "offices live in separate spans and must be joined — run together they read as one invented city");
  assert.equal(rows[0].location, "United States",
    '"All" is their wording for every office, and they are all US; it must not be shown raw');
  assert.equal(rows[2].title, "Graphic Design & Cartography Intern (Summer 2027)",
    "&#038; must be decoded, or the role reads as machine output");
  assert.ok(rows.every((r) => r.url.startsWith("https://www.kittelson.com/careers/")));
}

// ── Boston Strategic Partners ──────────────────────────────────────────────
const bspHtml = `
<a href="https://bostonsp.com/index.php/careers/data-scientist/">Data Scientist</a>
<a href="https://bostonsp.com/index.php/careers/data-scientist/">Read More &raquo;</a>
<a href="/index.php/careers/healthcare-associate/">Healthcare Associate</a>
<a href="/index.php/careers/healthcare-associate/">Read More &raquo;</a>
<a href="https://bostonsp.com/index.php/who-we-are/">Who We Are</a>`;

{
  const rows = parseBsp(bspHtml);
  assert.deepEqual(rows.map((r) => r.title), ["Data Scientist", "Healthcare Associate"],
    'every opening is linked twice; keeping the LAST would title them all "Read More »"');
  assert.equal(rows[1].url, "https://bostonsp.com/index.php/careers/healthcare-associate/",
    "a root-relative href must be made absolute, or the apply link is dead");
  assert.ok(rows.every((r) => r.location === "Boston, MA"));
  assert.ok(isUsLocation(rows[0].location), "the office must satisfy the positive US test");
}

// ── Trakstar Hire (Synapse) ────────────────────────────────────────────────
const feed = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel>
<title>Jobs at Synapse Energy Economics, Inc.</title>
<link>http://recruiterbox.com/jobfeeds/synapseenergy</link>
<item><title>Senior Associate, Transmission or Distribution</title>
<link>http://synapseenergy.hire.trakstar.com/jobs/fk025oh</link>
<pubDate>Mon, 11 May 2026 00:00:00 +0530</pubDate>
<description>&lt;h2 id="job_meta"&gt;&lt;p&gt;Location: Cambridge,Massachusetts,United States &lt;/p&gt;&lt;/h2&gt;</description>
</item>
<item><title>No Location Given</title><link>http://synapseenergy.hire.trakstar.com/jobs/zz1</link>
<description>&lt;p&gt;No meta block at all&lt;/p&gt;</description></item>
</channel></rss>`;

{
  const rows = parseFeed(feed);
  assert.equal(rows.length, 2, "the channel's own <title>/<link> must not be read as an item");
  assert.equal(rows[0].location, "Cambridge, Massachusetts, United States");
  assert.ok(isUsLocation(rows[0].location),
    "the feed writes the location with no spaces after the commas; unseparated it fails the US test");
  assert.equal(rows[0].url, "https://synapseenergy.hire.trakstar.com/jobs/fk025oh",
    "the feed's http:// links must be upgraded, not followed as-is");
  assert.equal(rows[1].location, "", "no Location line means no location — never a guess");
  assert.equal(parseLocation("nothing here"), "");
}

console.log("Own-site board tests passed. Offices joined, double links deduped, feed locations readable.");

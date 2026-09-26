// Avature portals (api/_shared/avature.js).
//
// This file exists because of two real breakages, both silent.
//
// 1. The module is shared. brassring.js imports parsePostedAt from it and
//    nothing in avature.js itself calls that function — so it looks unused and
//    is easy to drop. Dropping it took UBS and Edward Jones down with a
//    "parsePostedAt is not a function" crash, and a crashed source reports as
//    an employer with no openings.
//
// 2. The card's job link is written two ways. ManTech and MetLife use
//    "/JobDetail/<slug>/<id>"; RGP uses "/Careers/JobDetail?jobTitle=…&jobId=…".
//    A selector that insists on the trailing slash parses every RGP card to
//    null, and its 113-req board reads as empty with no error anywhere.
//
// Plus the thing that made the adapter necessary: two portal generations name
// the pager differently, and only one honours a page size.

const assert = require("node:assert/strict");
const { fetchAvatureListings, parsePostedAt, parseCard, countryFromSlug } = require("../api/_shared/avature.js");

// ── The shared export brassring.js depends on ───────────────────────────────
assert.equal(typeof parsePostedAt, "function",
  "brassring.js imports parsePostedAt from here; removing it crashes UBS and Edward Jones");
assert.equal(parsePostedAt("Job ID: 15518 • 17-Feb-2026"), "2026-02-17T00:00:00.000Z");
assert.equal(parsePostedAt("no date here"), null, "an unparseable date is null, never today's date");
assert.equal(parsePostedAt("31-Xxx-2026"), null, "an unknown month must not fall through to January");

// ── Slug countries ─────────────────────────────────────────────────────────
assert.equal(countryFromSlug("/careers/FolderDetail/United-States-Cyber-Intern/1"), "United States");
assert.equal(
  countryFromSlug("/careers/FolderDetail/Leeds-United-Kingdom-of-Great-Britain-and-Northern-Ireland-Director/2"),
  "United Kingdom",
  "the long UK spelling must be tested before the short one, and a leading city must not hide it");
assert.equal(countryFromSlug("/careers/FolderDetail/Canada-Analyste/3"), "Canada");
assert.equal(countryFromSlug("/careers/FolderDetail/Some-Town-Analyst/7"), "",
  "an unrecognised slug yields NO location, so the caller's US gate drops it rather than guessing");

const realFetch = global.fetch;
const asked = [];

// RGP shape: query-string job link, location in its own span, no bullets.
const rgpCard = (i) => `
  <article class="article article--result" id="article--${i}">
    <h3 class="article__header__text__title title title--10">
      <a class="link" href="/Careers/JobDetail?jobTitle=Consultant+${i}&amp;jobId=${900 + i}"> Consultant ${i} </a>
    </h3>
    <div class="article__header__text__subtitle">
      <span class="list-item-locationBuiltIn">Dallas, Texas, United States</span>
    </div>
    <div class="article__header__text__subtitle">
      <span class="article__header__text__subtitle__category"> Consulting </span>
    </div>
  </article>`;

// Maximus shape: path job link, and the slot that would hold a location holds
// a posted date and a job id instead.
const maximusCard = (slug, id, title) => `
  <article class="article article--result" id="article--${id}">
    <h3 class="article__header__text__title title title--04">
      <a class="link" href="/careers/FolderDetail/${slug}/${id}"> ${title} </a>
    </h3>
    <div class="article__header__text__subtitle">
      <span class="list-item-posted">Posted 25-Sep-2026</span>
      <span class="separator">&nbsp;&#8226;&nbsp;</span>
      <span class="list-item-jobId">Job ID #${id}</span>
    </div>
  </article>`;

global.fetch = async (url) => {
  const u = new URL(String(url));
  asked.push(u.pathname + u.search);
  if (u.pathname.startsWith("/Careers/")) {
    const offset = Number(u.searchParams.get("jobOffset") || 0);
    const body = offset === 0
      ? Array.from({ length: 40 }, (_, i) => rgpCard(i + 1)).join("")
      : rgpCard(99);
    return { ok: true, status: 200, text: async () => `<html>${body}</html>` };
  }
  const offset = Number(u.searchParams.get("folderOffset") || 0);
  if (offset > 0) return { ok: true, status: 200, text: async () => "<html></html>" };
  const body = [
    maximusCard("United-States-Cyber-Intern", 1, "Cyber Intern"),
    maximusCard("Leeds-United-Kingdom-of-Great-Britain-and-Northern-Ireland-Director", 2, "Director UK"),
    maximusCard("Canada-Analyste", 3, "Analyste"),
  ].join("");
  return { ok: true, status: 200, text: async () => `<html>${body}</html>` };
};

(async () => {
  try {
    // ── RGP: page size honoured, so the walk ends on a short page ───────────
    asked.length = 0;
    const rgp = await fetchAvatureListings("https://careers.rgp.com/Careers/SearchJobs", { pages: 4, perPage: 40 });
    assert.equal(rgp.length, 41, "a query-string job link must parse — insisting on /JobDetail/ empties the board");
    assert.match(asked[0], /jobRecordsPerPage=40&jobOffset=0/);
    assert.match(asked[1], /jobOffset=40/, "a full page of 40 must be followed by offset 40");
    // The walk ends on a page that adds nothing NEW, not on a short page —
    // Avature repeats the last page rather than returning an empty one, so a
    // short-page rule would stop one page early on some tenants.
    assert.equal(asked.length, 3, "page 3 repeats page 2's row, adds nothing, and ends the walk");
    assert.equal(rgp[0].location, "Dallas, Texas, United States",
      "the location span wins; the bullet parse would return the whole meta line with the category glued on");
    assert.equal(rgp[0].url, "https://careers.rgp.com/Careers/JobDetail?jobTitle=Consultant+1&jobId=901",
      "the &amp; in the href must be decoded, or the apply link 404s");

    // ── Maximus: page size ignored, so the SEARCH does the narrowing ────────
    asked.length = 0;
    const mx = await fetchAvatureListings("https://maximus.avature.net/careers/SearchJobs", {
      paging: "folder", terms: ["internship", "graduate"],
    });
    assert.ok(asked.every((a) => a.includes("folderOffset")), "a folder-paged portal must use folderOffset");
    // "internship" costs two: the page of rows, then one more to learn there
    // are no others. "graduate" costs one, because every row it returns has
    // already been seen — which is what stops a four-term read from being
    // four full walks of the same board.
    assert.deepEqual(asked.map((a) => new URLSearchParams(a.split("?")[1]).get("search")),
      ["internship", "internship", "graduate"]);
    assert.ok(asked.every((a) => Number(new URLSearchParams(a.split("?")[1]).get("folderOffset")) % 6 === 0),
      "a folder-paged portal returns six however many are asked for, so the offset must step by six");
    const byTitle = new Map(mx.map((r) => [r.title, r.location]));
    assert.equal(byTitle.get("Cyber Intern"), "United States",
      "with no location span, the country comes from the posting path");
    assert.equal(byTitle.get("Director UK"), "United Kingdom");
    assert.equal(byTitle.get("Analyste"), "Canada");

    // Default options must stay what MetLife's bare call has always relied on.
    assert.equal(fetchAvatureListings.length, 1, "searchUrl is the only required argument");

    console.log("Avature tests passed. Both link shapes parse, both pagers walk, parsePostedAt is still exported.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

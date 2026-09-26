// Avature portals (api/_shared/avature.js).
//
// These were recorded as unreadable — "a fixed latest-20 with no offset". Both
// halves were wrong: the list is server-rendered, and it pages. What is true is
// that two portal generations name the pager differently, and that only one of
// them honours a page size. Get that backwards and the reader silently returns
// the first six rows of a 400-req board for ever, which is exactly the failure
// this file exists to catch.

const assert = require("node:assert/strict");
const { fetchAvatureListings, parseArticles, countryFromSlug } = require("../api/_shared/avature.js");

const realFetch = global.fetch;
const asked = [];

const article = (id, title, href, locationSpan) => `
  <article class="article article--result" id="article--${id}">
    <div class="article__header"><div class="article__header__text">
      <h3 class="article__header__text__title title title--10">
        <a class="link" href="${href}"> ${title} </a>
      </h3>
      <div class="article__header__text__subtitle">
        ${locationSpan || '<span class="list-item-posted">Posted 25-Sep-2026</span><span class="list-item-jobId">Job ID #43712</span>'}
      </div>
    </div></div>
  </article>`;

const loc = (text) => `<span class="list-item-locationBuiltIn">${text}</span>`;

global.fetch = async (url) => {
  const u = new URL(String(url));
  asked.push(u.pathname + u.search);
  // RGP-style: page size honoured, so a full page is 40.
  if (u.pathname.startsWith("/Careers/")) {
    const offset = Number(u.searchParams.get("jobOffset") || 0);
    const body = offset === 0
      ? Array.from({ length: 40 }, (_, i) =>
          article(i + 1, `Consultant ${i}`, `/Careers/JobDetail?jobTitle=C${i}&amp;jobId=${900 + i}`, loc("Dallas, Texas, United States"))).join("")
      : article(99, "Summer Analyst Intern", "/Careers/JobDetail?jobTitle=Intern&amp;jobId=1000", loc("New York, New York, United States"));
    return { ok: true, status: 200, text: async () => `<html>${body}</html>` };
  }
  // Maximus-style: page size IGNORED — always six, whatever is asked for.
  const offset = Number(u.searchParams.get("folderOffset") || 0);
  const term = u.searchParams.get("search") || "";
  if (offset > 0) return { ok: true, status: 200, text: async () => "<html></html>" };
  const body = [
    article(1, "Cyber Intern", `/careers/FolderDetail/United-States-Cyber-Intern-${term}/1`, null),
    article(2, "Director UK", "/careers/FolderDetail/Leeds-United-Kingdom-of-Great-Britain-and-Northern-Ireland-Director/2", null),
    article(3, "Analyste", "/careers/FolderDetail/Canada-Analyste/3", null),
  ].join("");
  return { ok: true, status: 200, text: async () => `<html>${body}</html>` };
};

(async () => {
  try {
    // ── RGP shape: pages until a short page ────────────────────────────────
    asked.length = 0;
    const rgp = await fetchAvatureListings("https://careers.rgp.com/Careers/SearchJobs", { paging: "job", perPage: 40 });
    assert.match(asked[0], /jobRecordsPerPage=40&jobOffset=0/, "a job-paged portal must ask for the larger page");
    assert.match(asked[1], /jobOffset=40/, "a FULL page must be followed by the next offset");
    assert.equal(asked.length, 2, "a short page ends the walk — it must not keep asking");
    assert.equal(rgp.length, 41);
    assert.equal(rgp[40].title, "Summer Analyst Intern", "the second page's row must survive");
    assert.equal(rgp[0].location, "Dallas, Texas, United States", "the location span is what RGP fills");
    assert.equal(rgp[0].url, "https://careers.rgp.com/Careers/JobDetail?jobTitle=C0&jobId=900",
      "the &amp; in the href must be decoded, or the link 404s");

    // ── Maximus shape: page size ignored, so the SEARCH does the narrowing ──
    asked.length = 0;
    const mx = await fetchAvatureListings("https://maximus.avature.net/careers/SearchJobs", {
      paging: "folder", terms: ["internship", "graduate"],
    });
    assert.ok(asked.every((a) => a.includes("folderOffset")), "a folder-paged portal must use folderOffset");
    assert.deepEqual(asked.map((a) => new URLSearchParams(a.split("?")[1]).get("search")),
      ["internship", "graduate"],
      "three rows is a short page, so each term costs exactly one request");
    // Location comes from the URL slug here, because the row has no location span.
    const byTitle = new Map(mx.map((r) => [r.title, r.location]));
    assert.equal(byTitle.get("Cyber Intern"), "United States");
    assert.equal(byTitle.get("Director UK"), "United Kingdom",
      "the long UK spelling must win over the short one, and a leading city must not hide it");
    assert.equal(byTitle.get("Analyste"), "Canada");

    // A slug with no country we recognise yields NO location, never a guess —
    // the positive US gate then drops it, which is the safe direction.
    assert.equal(countryFromSlug("https://x.avature.net/careers/FolderDetail/Some-Town-Analyst/7"), "");

    // A row with no title is not a job.
    assert.equal(parseArticles(article(1, "", "/x/1", null), "https://x").length, 0);

    console.log("Avature tests passed. Both pagers walk, and the slug country is read, not guessed.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

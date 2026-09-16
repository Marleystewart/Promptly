// Bates White — viRecruit (bateswhite-apply.viglobalcloud.com), linked from
// bateswhite.com/careers/current-openings. The list is server-rendered but
// split by category (FilterREID=n), and each row applies via an ASP.NET
// postback, so there is no per-job URL. The card links to its category page,
// with the title as an extra parameter so two reqs on one page stay distinct
// (dedupe keys on the URL; viRecruit ignores the extra parameter).
//   <h4>Summer Consultant—2027</h4> … <h5>Office <span>Washington DC</span></h5>
//   … <h5>Date Posted <span>Aug 07, 2026</span></h5>
// Every Bates White office is in the US.
const BASE = "https://bateswhite-apply.viglobalcloud.com/viRecruitSelfApply/RecDefault.aspx";
const CATEGORIES = [1, 2, 3, 4, 5, 6, 7, 8];

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parseRows(html, reid) {
  return [...String(html).matchAll(/<h4>([^<]+)<\/h4>\s*<section class="sub-title">([\s\S]*?)<\/section>/g)].map(([, rawTitle, meta]) => {
    const title = decode(rawTitle);
    const field = (label) => decode((meta.match(new RegExp(`<h5>${label} <span>([^<]*)</span>`)) || [])[1]);
    const posted = Date.parse(field("Date Posted"));
    return {
      title,
      url: `${BASE}?FilterREID=${reid}&title=${encodeURIComponent(title)}`,
      location: field("Office"),
      postedAt: Number.isFinite(posted) ? new Date(posted).toISOString() : null,
    };
  });
}

module.exports = async function fetchListings() {
  const seen = new Map();
  let answered = 0;
  for (const reid of CATEGORIES) {
    try {
      const res = await fetch(`${BASE}?FilterREID=${reid}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)", Accept: "text/html" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      answered += 1;
      for (const row of parseRows(await res.text(), reid)) {
        const key = `${row.title}|${row.location}`;
        if (!seen.has(key)) seen.set(key, row);
      }
    } catch {
      // one category failing must not blank the others
    }
  }
  if (!answered) throw new Error("bates white: no category page answered");
  return [...seen.values()];
};

module.exports.parseRows = parseRows;

// Kittelson & Associates — its own careers page, which IS the board. There is
// no ATS behind it, which is why every earlier sweep recorded "no job board
// found"; the openings are WordPress posts rendered straight into the page:
//
//   <article class="… article--detail tag--intern …">
//     <div class="medium-3 columns"><a href="…"><h3>TITLE</h3></a></div>
//     …
//     <h4><i>Office: </i><span>Bend</span><span>Boise</span>…</h4>
//
// Offices are bare city names in separate spans, so they are joined rather than
// run together ("BendBoiseMiami" otherwise). A US transportation-engineering
// firm with only US offices, so "All" — their wording for every office — is
// rendered as the country rather than dropped.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";
const CAREERS = "https://www.kittelson.com/careers/";

function clean(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;|&#0?38;/g, "&").replace(/&#8217;|&#0?39;|&#x27;/g, "'")
    .replace(/&#8211;|&ndash;/g, "–").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseOpenings(html) {
  const out = [];
  const blocks = String(html).split(/<article[^>]*class="[^"]*article--detail/i).slice(1);
  for (const block of blocks) {
    const link = block.match(/<a[^>]*href="([^"]+)"[^>]*>\s*<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!link) continue;
    const title = clean(link[2]);
    if (!title) continue;
    const cell = block.match(/Office:\s*<\/i>([\s\S]*?)<\/h4>/i);
    const offices = cell
      ? [...cell[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => clean(m[1])).filter(Boolean)
      : [];
    const location = offices.length && offices.join(" ").trim() !== "All"
      ? offices.join("; ")
      : "United States";
    out.push({ title, url: link[1], location, postedAt: null });
  }
  return out;
}

module.exports = async function fetchListings() {
  const res = await fetch(CAREERS, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} kittelson`);
  return parseOpenings(await res.text());
};
module.exports.parseOpenings = parseOpenings;

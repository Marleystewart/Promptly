// Trakstar Hire (formerly Recruiterbox) — <tenant>.hire.trakstar.com.
//
// Found by following a careers page that appeared to have no board at all:
// Synapse Energy Economics embeds Recruiterbox's widget script, and the tenant
// name is only in the widget's own JS ("synapseenergy.recruiterbox.com", which
// now redirects to hire.trakstar.com). The careers page itself names nothing,
// which is why every sweep filed it as "no ATS link, feed or embed".
//
// The tenant publishes an RSS feed — /jobfeeds/<tenant> — which is the cleanest
// thing to read: one <item> per opening, with the location inside the escaped
// description rather than as an element of its own:
//
//   <item><title>Senior Associate, Transmission or Distribution</title>
//     <link>http://synapseenergy.hire.trakstar.com/jobs/fk025oh</link>
//     <description>&lt;h2 id="job_meta"&gt;&lt;p&gt;Location: Cambridge,Massachusetts,United States
//
// The feed's own <link> elements are http:// and point at recruiterbox.com in
// the channel header; the per-item links are the tenant's real host, so they
// are upgraded to https rather than rewritten.

const UA = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";

function unescapeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function text(value) {
  return unescapeXml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// "Cambridge,Massachusetts,United States" -> "Cambridge, Massachusetts, United States".
// Written without spaces in the feed, which leaves the positive US test with no
// ", ST" and no readable country until it is separated out.
function parseLocation(description) {
  const match = unescapeXml(description).match(/Location:\s*([^<]+)/i);
  if (!match) return "";
  return match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function parseFeed(xml) {
  const out = [];
  for (const item of String(xml).split(/<item>/).slice(1)) {
    const title = text((item.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const link = text((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    if (!title || !link) continue;
    const posted = (item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
    out.push({
      title,
      url: link.replace(/^http:\/\//, "https://"),
      location: parseLocation((item.match(/<description>([\s\S]*?)<\/description>/) || [])[1]),
      postedAt: posted ? posted.trim() : null,
    });
  }
  return out;
}

async function fetchTrakstarListings(tenant) {
  const url = `https://${tenant}.hire.trakstar.com/jobfeeds/${tenant}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${res.status} trakstar ${tenant}`);
  return parseFeed(await res.text());
}

module.exports = { fetchTrakstarListings, parseFeed, parseLocation };

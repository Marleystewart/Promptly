// Huntington's branded careers site exposes a public JSON search endpoint.
// Querying its explicit Early Career/Internship category avoids the noisy
// full Workday search and remains useful even when the category is empty.

const API_URL = "https://huntington-careers.com/Search/SearchResults";
const JOB_ORIGIN = "https://huntington-careers.com";
const EARLY_CAREER_FAMILY = "07eb4169-22df-4177-873f-9601605b917b";

function slugify(value) {
  return String(value || "").toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchListings() {
  const url = new URL(API_URL);
  url.searchParams.set("FamilyID", EARLY_CAREER_FAMILY);
  url.searchParams.set("jtStartIndex", "0");
  url.searchParams.set("jtPageSize", "100");
  const res = await fetch(url, {
    headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} huntington`);
  let data = await res.json();
  if (typeof data === "string") data = JSON.parse(data);
  const records = Array.isArray(data.Records) ? data.Records : [];
  return records.map((record) => {
    const tracking = record.TrackingObject || {};
    const title = String(tracking.TitleJson || "").trim();
    const locations = Array.isArray(tracking.CityStatesDataAbbrevJson)
      ? tracking.CityStatesDataAbbrevJson.filter(Boolean).join("; ") : "";
    return {
      title,
      url: `${JOB_ORIGIN}/search/jobdetails/${slugify(title)}/${encodeURIComponent(record.ID)}`,
      location: locations,
    };
  }).filter((job) => job.title && job.url);
}

module.exports = fetchListings;

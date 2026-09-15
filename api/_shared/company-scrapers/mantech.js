const { fetchAvatureListings } = require("../avature");
const { usOnly } = require("../us-location");
// ManTech — Avature (careers.mantech.com). Its location line reads
// "Location: USA-TX-San Antonio"; rewrite to "San Antonio, TX, USA".
function tidy(location) {
  const text = String(location || "").replace(/^Location:\s*/i, "").trim();
  const m = text.match(/^(USA|United States)-([A-Z]{2})-(.+)$/i);
  return m ? `${m[3].trim()}, ${m[2].toUpperCase()}, USA` : text;
}
module.exports = async function fetchListings() {
  const rows = await fetchAvatureListings("https://mantech.avature.net/careers/SearchJobs");
  return usOnly(rows.map((row) => ({ ...row, location: tidy(row.location) })));
};

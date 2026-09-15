const { fetchIcimsListings, usIcimsOnly } = require("../icims");
// Analysis Group keeps two iCIMS portals, both linked from analysisgroup.com:
// professionalcareers-analysisgroup (consulting) and
// datasciencecareers-analysisgroup (data science). Read both.
const PORTALS = ["professionalcareers-analysisgroup", "datasciencecareers-analysisgroup"];
module.exports = async function fetchListings() {
  const results = await Promise.allSettled(PORTALS.map((p) => fetchIcimsListings(`https://${p}.icims.com`)));
  if (results.every((r) => r.status === "rejected")) throw results[0].reason;
  return usIcimsOnly(results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])));
};

const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// Publicis Sapient — Publicis Groupe's shared Jibe site lists every agency side by side; tags2 names the brand, so keep only Publicis Sapient's reqs.
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.publicisgroupe.com", ["intern", "internship", "graduate", "university"], { where: (job) => (job.tags2 || []).some((t) => /publicis sapient/i.test(t)) }));
};

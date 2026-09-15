const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// Epsilon — Publicis Groupe's shared Jibe site; tags2 names the brand, so keep only Epsilon's reqs.
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.publicisgroupe.com", ["intern", "internship", "graduate", "university"], { where: (job) => (job.tags2 || []).some((t) => /^epsilon\b/i.test(t)) }));
};

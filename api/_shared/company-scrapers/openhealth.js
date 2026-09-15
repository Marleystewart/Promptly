const { fetchSfCareersListings, usSfCareersOnly } = require("../sf-careers");
// OPEN Health — SuccessFactors Career Site Builder (careers.openhealthgroup.com).
// A 26-req board, so no facet: the country code in jobLocationShort filters it.
module.exports = async function fetchListings() {
  return usSfCareersOnly(await fetchSfCareersListings("https://careers.openhealthgroup.com", { terms: [""] }));
};

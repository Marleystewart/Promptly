const { fetchSfCareersListings, usSfCareersOnly } = require("../sf-careers");
// Wipro — SuccessFactors Career Site Builder (careers.wipro.com). Its own
// jobLocationCountry facet is applied server-side: 5,502 reqs worldwide, 133 US.
module.exports = async function fetchListings() {
  return usSfCareersOnly(await fetchSfCareersListings("https://careers.wipro.com", {
    facetFilters: { jobLocationCountry: ["United States"] },
  }));
};

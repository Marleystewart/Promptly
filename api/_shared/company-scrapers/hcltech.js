const { fetchSfCareersListings, usSfCareersOnly } = require("../sf-careers");
// HCLTech — SuccessFactors Career Site Builder (careers.hcltech.com). Country is
// in a custom field, custCountryRegion, which is also its facet.
module.exports = async function fetchListings() {
  return usSfCareersOnly(await fetchSfCareersListings("https://careers.hcltech.com", {
    facetFilters: { custCountryRegion: ["United States"] },
  }));
};

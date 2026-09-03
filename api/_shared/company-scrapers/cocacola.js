const { fetchFindlyListings, usFindlyOnly } = require("../findly");
// Coca-Cola — Findly (careers.coca-colacompany.com, CNAME coca-cola.cdn.findly.com).
// "internal" backend: numeric Organization id, and the search parameter is
// SearchText — Keyword/q/Search are accepted and silently ignored.
module.exports = async function fetchListings() {
  return usFindlyOnly(await fetchFindlyListings(
    { backend: "internal", organization: 2110, portalId: "CocaCola-Workday-External" },
    ["intern", "internship", "graduate", "university"],
  ));
};

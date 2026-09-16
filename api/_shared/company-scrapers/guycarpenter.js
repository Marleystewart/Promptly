const { fetchMmcBrand } = require("../mmc");
// Guy Carpenter — Marsh McLennan's shared Workday board, routed by legal entity.
// Not on the 500-firm list, but it costs no extra request. See api/_shared/mmc.js.
module.exports = () => fetchMmcBrand("guycarpenter");

const { fetchMmcBrand } = require("../mmc");
// Marsh (the broker, plus Marsh McLennan corporate) — the shared Workday board,
// routed by legal entity after the Agency and sister firms are claimed. See api/_shared/mmc.js.
module.exports = () => fetchMmcBrand("marsh");

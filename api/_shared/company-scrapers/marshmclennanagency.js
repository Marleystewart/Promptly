const { fetchMmcBrand } = require("../mmc");
// Marsh McLennan Agency — Marsh McLennan's shared Workday board, routed by
// legal entity ("Marsh & McLennan Agency LLC"). See api/_shared/mmc.js.
module.exports = () => fetchMmcBrand("mma");

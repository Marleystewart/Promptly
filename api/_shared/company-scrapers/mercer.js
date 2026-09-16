const { fetchMmcBrand } = require("../mmc");
// Mercer — Marsh McLennan's shared Workday board, routed by legal entity
// ("Mercer (US) LLC", "Mercer Health & Benefits LLC"). See api/_shared/mmc.js.
module.exports = () => fetchMmcBrand("mercer");

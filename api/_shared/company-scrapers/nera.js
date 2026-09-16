const { fetchMmcBrand } = require("../mmc");
// NERA Economic Consulting — Marsh McLennan's shared Workday board, routed by
// legal entity ("National Economic Research Associates, Inc."). See api/_shared/mmc.js.
module.exports = () => fetchMmcBrand("nera");

const { fetchMmcBrand } = require("../mmc");
// Oliver Wyman (Lippincott included) hires on Marsh McLennan's shared Workday
// board; each req is routed by its hiring legal entity. See api/_shared/mmc.js.
// Replaces lever:oliverwyman, which is "Oliver Wyman Labs" — two non-student
// tech roles, not the consultancy students are looking for.
module.exports = () => fetchMmcBrand("oliverwyman");

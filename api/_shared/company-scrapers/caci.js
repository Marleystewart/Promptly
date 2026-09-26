const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");

// CACI International — Eightfold at searchcareers.caci.com, which caci.com's
// own careers page links. The SmartRecruiters board that resolves under "caci"
// carries only a handful of reqs; this is the site CACI actually points at.
//
// CACI is a US federal contractor, so nearly everything is US, but the gate
// stays on: it also hires in Germany and the UK.
module.exports = async function fetchListings() {
  return usOnly(await fetchEightfoldListings(
    "https://searchcareers.caci.com", "caci.com",
    ["intern", "internship", "co-op", "graduate", "entry level"],
  ));
};

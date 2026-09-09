const { fetchEightfoldListings } = require("../eightfold");
const { usOnly } = require("../us-location");

// Morgan Stanley — Eightfold (morganstanley.eightfold.ai).
//
// Not discoverable from the markup: morganstanley.com/careers renders its job
// list with JavaScript and links to nothing an ATS pattern matches. The tenant
// was found by trying the careers subdomain directly.
//
// The `domain` parameter is the tenant's registered domain — `morganstanley.com`
// works, `ms.com` returns 404. Per SOURCE-HUNTING-FINDINGS.md this value is not
// reliably the hostname (Mayo Clinic is `mc.org`), so it has to be confirmed
// rather than assumed.
//
// The board is global and heavily international, so usOnly() does real work
// here — the raw feed opens with Mumbai and Budapest roles.
module.exports = async function fetchListings() {
  return usOnly(
    await fetchEightfoldListings(
      "https://morganstanley.eightfold.ai",
      "morganstanley.com",
      ["intern", "internship", "summer analyst", "graduate", "campus"]
    )
  );
};

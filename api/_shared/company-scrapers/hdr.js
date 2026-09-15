const { fetchTaleoRestListings } = require("../taleo");
const { usOnly } = require("../us-location");
// HDR — Taleo section "ex" on its newer REST job board; portal id 101430233 is
// published in hdrinc.com/careers links. Has Canadian and Australian offices,
// so US-filtered. See the REST notes in api/_shared/taleo.js.
module.exports = async function fetchListings() {
  return usOnly(await fetchTaleoRestListings("hdr", "ex", "101430233"));
};

const { fetchJibeListings } = require("../jibe");
const { usOnly } = require("../us-location");
// RTI International — Jibe (careers.rti.org). Its iCIMS portals redirect here.
// 27 reqs, 20 of them US; UK, Spain and Indonesia are filtered out.
module.exports = async function fetchListings() {
  return usOnly(await fetchJibeListings("https://careers.rti.org", ["intern", "internship", "graduate", "university"]));
};

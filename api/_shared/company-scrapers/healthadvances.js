// Health Advances — healthadvances.com is behind a Cloudflare challenge, but
// its jobs are ClearCompany's, and ClearCompany's own public board
// (healthadvances.hrmdirect.com) answers a plain fetch. That board has no
// location column: the office rides in the title ("Analyst Intern (Newton,
// June 2027)"). Health Advances also has offices outside the US, so a req is
// kept only when its title names a US office; anything else is dropped.
const { fetchSmallAtsListings } = require("../small-ats");

const US_OFFICES = [
  [/\bnewton\b/i, "Newton, MA, United States"],
  [/\b(sf|san francisco)\b/i, "San Francisco, CA, United States"],
  [/\bboston\b/i, "Boston, MA, United States"],
  [/\bnew york\b|\bnyc\b/i, "New York, NY, United States"],
];

module.exports = async function fetchListings() {
  const rows = await fetchSmallAtsListings("hrmdirect", "healthadvances");
  return rows.map(({ us: _us, ...row }) => {
    const office = US_OFFICES.find(([re]) => re.test(row.title));
    return office ? { ...row, location: office[1] } : null;
  }).filter(Boolean);
};

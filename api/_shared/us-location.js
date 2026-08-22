// Positive US-location test for scrapers that read global employer boards.
//
// aggregator.js filters by an international BLOCKLIST, which is necessarily
// incomplete — a role in Selangor, Dhaka, or any city/country not on the list
// slips through into this US-only product. For employers whose feed is mostly
// non-US (big pharma, global CPG), a scraper should instead keep only roles it
// can POSITIVELY confirm are US, so an unknown foreign city is dropped by
// default rather than leaked. Precision over recall, on purpose.
//
// A record counts as US if ANY of its offices (locations can be "; "-joined)
// names the country (United States/USA), a 2-letter state code after a comma,
// or a full US state name.

const STATE_CODE = /,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;
const COUNTRY = /\b(?:united states(?: of america)?|u\.?s\.?a\.?|\busa\b)\b/i;
const STATE_NAME = /\b(?:alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia)\b/i;

function isUsLocation(location) {
  const value = String(location || "");
  if (!value) return false;
  return COUNTRY.test(value) || STATE_CODE.test(value) || STATE_NAME.test(value);
}

// Keep only records whose location is positively US.
function usOnly(records) {
  return (Array.isArray(records) ? records : []).filter((r) => isUsLocation(r.location));
}

module.exports = { isUsLocation, usOnly };

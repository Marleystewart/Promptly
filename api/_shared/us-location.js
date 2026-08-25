// Positive US-location test for scrapers reading global employer boards, where
// aggregator.js's international blocklist can't cover every foreign city.
const STATE_CODE = /,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/;
const COUNTRY = /\b(?:united states(?: of america)?|u\.?s\.?a\.?|\busa\b)\b/i;
const STATE_NAME = /\b(?:alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia)\b/i;
function isUsLocation(location) {
  const v = String(location || "");
  return v ? (COUNTRY.test(v) || STATE_CODE.test(v) || STATE_NAME.test(v)) : false;
}
function usOnly(records) {
  return (Array.isArray(records) ? records : []).filter((r) => isUsLocation(r.location));
}
module.exports = { isUsLocation, usOnly };

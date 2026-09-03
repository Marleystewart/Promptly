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

// The negative lookahead matters for global feeds that use ISO subdivisions:
// "München,DE-BY,Germany" is Bavaria, not Delaware.
const STATE_CODE = /,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b(?!-)/;
const COUNTRY = /\b(?:united states(?: of america)?|u\.?s\.?a\.?|\busa\b)\b/i;
const STATE_NAME = /\b(?:alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia)\b/i;

// A state NAME can appear inside a foreign place name: "Tijuana, Baja
// California, Mexico" matched /california/ and was admitted as a US role. So a
// foreign country in the COUNTRY POSITION — the last comma-separated segment —
// overrides everything else.
//
// Anchoring on the last segment rather than searching the whole string is what
// keeps this safe in both directions. "Mexico, Missouri" (a real US town) still
// passes, because its last segment is Missouri, not Mexico. And Taleo-style
// "United States-California-San Diego", which has no commas at all, is left
// entirely to the positive tests below.
const FOREIGN_LAST = /(?:^|,)\s*(?:mexico|canada|brazil|colombia|argentina|chile|peru|india|china|japan|korea|singapore|malaysia|indonesia|philippines|vietnam|thailand|taiwan|australia|new zealand|ireland|united kingdom|england|scotland|wales|germany|france|spain|italy|portugal|netherlands|belgium|switzerland|austria|sweden|norway|denmark|finland|poland|czech(?:ia| republic)?|hungary|romania|greece|turkey|israel|egypt|nigeria|kenya|south africa|morocco|uae|united arab emirates|saudi arabia|qatar|russia|ukraine)\s*$/i;

function isUsLocation(location) {
  const value = String(location || "");
  if (!value) return false;
  // Any office being US is enough, so test each "; "-joined location on its own
  // — otherwise one foreign entry would veto a genuinely US-and-abroad posting.
  const offices = value.split(";").map((part) => part.trim()).filter(Boolean);
  return offices.some((office) => {
    if (FOREIGN_LAST.test(office)) return false;
    return COUNTRY.test(office) || STATE_CODE.test(office) || STATE_NAME.test(office);
  });
}

// Keep only records whose location is positively US.
function usOnly(records) {
  return (Array.isArray(records) ? records : []).filter((r) => isUsLocation(r.location));
}

module.exports = { isUsLocation, usOnly };

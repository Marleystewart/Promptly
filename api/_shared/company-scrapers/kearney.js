const { fetchYelloListings, usYelloOnly } = require("../yello");
// Kearney — Yello job board (kearney.recsolu.com), linked from kearney.com/careers.
// The search route is keyed by the board token on that page, not the "1" in its URL.
module.exports = async function fetchListings() {
  // Two terms, three pages: each search call takes ~2s, and "intern"/"summer"
  // cover every student title Kearney posts ("2027 Kearney Summer Analyst").
  return usYelloOnly(await fetchYelloListings("kearney.recsolu.com", "EPd41qlA4_03IncZMnWyRQ", { terms: ["intern", "summer"], maxPages: 3 }));
};

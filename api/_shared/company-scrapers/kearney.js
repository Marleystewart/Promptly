const { fetchYelloListings, usYelloOnly } = require("../yello");
// Kearney — Yello job board (kearney.recsolu.com), linked from kearney.com/careers.
// The search route is keyed by the board token on that page, not the "1" in its URL.
module.exports = async function fetchListings() {
  return usYelloOnly(await fetchYelloListings("kearney.recsolu.com", "EPd41qlA4_03IncZMnWyRQ"));
};

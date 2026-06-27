// ─────────────────────────────────────────────────────────────────────────
// Company watch-list (directory).
//
// These are firms Promptly TRACKS. They render as cards even before a real
// 2027 posting exists — shown as "Awaiting 2027 posting" (honest: we're
// watching, nothing live yet). The moment the live pipeline finds a real
// posting for one, the card flips to the verified listing automatically and
// the placeholder disappears. No fake links, ever.
//
// field/subField drive the filters. logo files live in assets/logos/<slug>.png
// (missing logos fall back to a clean colored tile).
// ─────────────────────────────────────────────────────────────────────────
window.WATCHLIST = [
  // ── Payments / card networks ─────────────────────────────────────────────
  { company: "Visa", short: "V", field: "Finance", subField: "Payments", logo: "assets/logos/visa.png" },
  { company: "Mastercard", short: "MA", field: "Finance", subField: "Payments", logo: "assets/logos/mastercard.png" },
  { company: "PayPal", short: "PYPL", field: "Finance", subField: "Payments", logo: "assets/logos/paypal.png" },
  { company: "American Express", short: "AXP", field: "Finance", subField: "Payments", logo: "assets/logos/amex.png" },
  { company: "Discover Financial", short: "DFS", field: "Finance", subField: "Payments", logo: "assets/logos/discover.png" },
  { company: "Block (Square)", short: "XYZ", field: "Finance", subField: "Payments", logo: "assets/logos/block.png" },
  { company: "Green Dot", short: "GDOT", field: "Finance", subField: "Payments", logo: "assets/logos/greendot.png" },
  { company: "Marqeta", short: "MQ", field: "Finance", subField: "Payments", logo: "assets/logos/marqeta.png" },

  // ── Fintech / lending / financial software ───────────────────────────────
  { company: "Synchrony Financial", short: "SYF", field: "Finance", subField: "Fintech", logo: "assets/logos/synchrony.png" },
  { company: "Bread Financial", short: "BFH", field: "Finance", subField: "Fintech", logo: "assets/logos/breadfinancial.png" },
  { company: "Klarna", short: "KLAR", field: "Finance", subField: "Fintech", logo: "assets/logos/klarna.png" },
  { company: "Plaid", short: "PLD", field: "Finance", subField: "Fintech", logo: "assets/logos/plaid.png" },
  { company: "nCino", short: "NCNO", field: "Finance", subField: "Fintech", logo: "assets/logos/ncino.png" },
  { company: "Blend", short: "BLND", field: "Finance", subField: "Fintech", logo: "assets/logos/blend.png" },
  { company: "Enova International", short: "ENVA", field: "Finance", subField: "Fintech", logo: "assets/logos/enova.png" },
  { company: "OppFi", short: "OPFI", field: "Finance", subField: "Fintech", logo: "assets/logos/oppfi.png" },
  { company: "LendingClub", short: "LC", field: "Finance", subField: "Fintech", logo: "assets/logos/lendingclub.png" },
  { company: "Prosper Marketplace", short: "PRSP", field: "Finance", subField: "Fintech", logo: "assets/logos/prosper.png" },
  { company: "Morningstar", short: "MORN", field: "Finance", subField: "Fintech", logo: "assets/logos/morningstar.png" },
  { company: "FactSet", short: "FDS", field: "Finance", subField: "Fintech", logo: "assets/logos/factset.png" },
  { company: "Broadridge Financial", short: "BR", field: "Finance", subField: "Fintech", logo: "assets/logos/broadridge.png" },
  { company: "SS&C Technologies", short: "SSNC", field: "Finance", subField: "Fintech", logo: "assets/logos/ssctech.png" },
  { company: "FIS Global", short: "FIS", field: "Finance", subField: "Fintech", logo: "assets/logos/fisglobal.png" },
  { company: "Fiserv", short: "FI", field: "Finance", subField: "Fintech", logo: "assets/logos/fiserv.png" },
  { company: "Jack Henry & Associates", short: "JKHY", field: "Finance", subField: "Fintech", logo: "assets/logos/jackhenry.png" },
  { company: "Temenos", short: "TEMN", field: "Finance", subField: "Fintech", logo: "assets/logos/temenos.png" },
  { company: "Bottomline Technologies", short: "EPAY", field: "Finance", subField: "Fintech", logo: "assets/logos/bottomline.png" },
  { company: "Kyriba", short: "KYRB", field: "Finance", subField: "Fintech", logo: "assets/logos/kyriba.png" },

  // ── Private equity ───────────────────────────────────────────────────────
  { company: "Apollo Global Management", short: "APO", field: "Finance", subField: "Private Equity", logo: "assets/logos/apollo.png" },
  { company: "KKR", short: "KKR", field: "Finance", subField: "Private Equity", logo: "assets/logos/kkr.png" },
  { company: "Carlyle Group", short: "CG", field: "Finance", subField: "Private Equity", logo: "assets/logos/carlyle.png" },
  { company: "Warburg Pincus", short: "WP", field: "Finance", subField: "Private Equity", logo: "assets/logos/warburgpincus.png" },
  { company: "TPG", short: "TPG", field: "Finance", subField: "Private Equity", logo: "assets/logos/tpg.png" },
  { company: "Advent International", short: "ADV", field: "Finance", subField: "Private Equity", logo: "assets/logos/advent.png" },
  { company: "Vista Equity Partners", short: "VISTA", field: "Finance", subField: "Private Equity", logo: "assets/logos/vista.png" },
  { company: "Francisco Partners", short: "FP", field: "Finance", subField: "Private Equity", logo: "assets/logos/franciscopartners.png" },
  { company: "Silver Lake", short: "SL", field: "Finance", subField: "Private Equity", logo: "assets/logos/silverlake.png" },
  { company: "Madison Dearborn", short: "MDP", field: "Finance", subField: "Private Equity", logo: "assets/logos/mdcp.png" },
  { company: "GTCR", short: "GTCR", field: "Finance", subField: "Private Equity", logo: "assets/logos/gtcr.png" },
  { company: "Riverside Company", short: "RIV", field: "Finance", subField: "Private Equity", logo: "assets/logos/riverside.png" },
  { company: "Audax Private Equity", short: "AUD", field: "Finance", subField: "Private Equity", logo: "assets/logos/audax.png" },
  { company: "Summit Partners", short: "SMT", field: "Finance", subField: "Private Equity", logo: "assets/logos/summitpartners.png" },
  { company: "Leonard Green & Partners", short: "LGP", field: "Finance", subField: "Private Equity", logo: "assets/logos/leonardgreen.png" },
  { company: "Thoma Bravo", short: "TB", field: "Finance", subField: "Private Equity", logo: "assets/logos/thomabravo.png" },
  { company: "Roark Capital Group", short: "ROARK", field: "Finance", subField: "Private Equity", logo: "assets/logos/roark.png" },
  { company: "Welsh Carson", short: "WCAS", field: "Finance", subField: "Private Equity", logo: "assets/logos/welshcarson.png" },
  { company: "Thomas H. Lee Partners", short: "THL", field: "Finance", subField: "Private Equity", logo: "assets/logos/thl.png" },
  { company: "American Securities", short: "AS", field: "Finance", subField: "Private Equity", logo: "assets/logos/americansecurities.png" },
  { company: "Genstar Capital", short: "GEN", field: "Finance", subField: "Private Equity", logo: "assets/logos/genstar.png" },
  { company: "New Mountain Capital", short: "NMC", field: "Finance", subField: "Private Equity", logo: "assets/logos/newmountain.png" },

  // ── Private credit ───────────────────────────────────────────────────────
  { company: "Blue Owl Capital", short: "OWL", field: "Finance", subField: "Private Credit", logo: "assets/logos/blueowl.png" },
  { company: "Sixth Street Partners", short: "6TH", field: "Finance", subField: "Private Credit", logo: "assets/logos/sixthstreet.png" },
  { company: "Golub Capital", short: "GOLUB", field: "Finance", subField: "Private Credit", logo: "assets/logos/golub.png" },
  { company: "Monroe Capital", short: "MRCC", field: "Finance", subField: "Private Credit", logo: "assets/logos/monroe.png" },
  { company: "Antares Capital", short: "ANT", field: "Finance", subField: "Private Credit", logo: "assets/logos/antares.png" },
  { company: "Prospect Capital", short: "PSEC", field: "Finance", subField: "Private Credit", logo: "assets/logos/prospect.png" },
  { company: "FS Investments", short: "FS", field: "Finance", subField: "Private Credit", logo: "assets/logos/fsinvestments.png" },
  { company: "Benefit Street Partners", short: "BSP", field: "Finance", subField: "Private Credit", logo: "assets/logos/benefitstreet.png" },
  { company: "LoanCore Capital", short: "LC2", field: "Finance", subField: "Private Credit", logo: "assets/logos/loancore.png" },
];

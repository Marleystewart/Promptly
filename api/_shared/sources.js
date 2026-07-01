// ─────────────────────────────────────────────────────────────────────────
// Live source registry for the openings aggregator.
//
// Every source points at an employer's OWN applicant-tracking system (ATS)
// feed — Greenhouse, Workday, or Lever — so each posting we surface is a real,
// live job req straight from the company, not a hand-typed entry. Adding
// coverage = adding one line here. No scraping of third-party sites, no fake.
//
// Greenhouse: { ats:"greenhouse", board:"<token>" }  (boards.greenhouse.io/<token>)
// Lever:      { ats:"lever", board:"<company>" }      (jobs.lever.co/<company>)
// Workday:    { ats:"workday", tenant, dc, site }     (from a posting URL:
//             https://<tenant>.<dc>.myworkdayjobs.com/en-US/<site>/job/...)
//
// All boards below were probed and confirmed responding. Field-tinted logo
// tiles (tech/fin/health/edu) are used for auto-pulled listings.
// ─────────────────────────────────────────────────────────────────────────

const SOURCES = [
  // ═══ FINANCE ═════════════════════════════════════════════════════════════
  // Hedge funds / quant
  { company: "Point72", short: "P72", logoClass: "p72", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "point72" },
  { company: "Jane Street", short: "JS", logoClass: "jane", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "janestreet" },
  { company: "DRW", short: "DRW", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "drweng" },
  { company: "Jump Trading", short: "JUMP", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "jumptrading" },
  { company: "PDT Partners", short: "PDT", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "pdtpartners" },
  { company: "Squarepoint Capital", short: "SQP", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "squarepointcapital" },
  // Quant trading / market makers
  { company: "IMC Trading", short: "IMC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "imc" },
  { company: "Akuna Capital", short: "AKU", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "akunacapital" },
  { company: "Flow Traders", short: "FLOW", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "flowtraders" },
  { company: "Old Mission", short: "OMC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "oldmissioncapital" },
  { company: "Five Rings", short: "5R", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "fiveringsllc" },
  // Private equity / asset management
  { company: "General Atlantic", short: "GA", logoClass: "ga", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "generalatlantic" },
  { company: "Bain Capital", short: "BCap", logoClass: "bcap", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "baincapital", dc: "wd1", site: "External_Public" },
  { company: "Blackstone", short: "BX", logoClass: "bx", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "blackstone", dc: "wd1", site: "Blackstone_Campus_Careers" },
  { company: "Ares Management", short: "ARES", logoClass: "ares", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "aresmgmt", dc: "wd1", site: "external" },
  // Investment banking
  { company: "Guggenheim Securities", short: "GUG", logoClass: "gug", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "guggenheim", dc: "wd1", site: "Guggenheim_Careers_Campus" },
  { company: "Houlihan Lokey", short: "HL", logoClass: "laz", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "hl", dc: "wd1", site: "Campus" },
  // Fintech (consumer finance)
  { company: "Stripe", short: "STRP", logoClass: "stripe", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "stripe" },
  { company: "Coinbase", short: "COIN", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "coinbase" },
  { company: "Robinhood", short: "HOOD", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "robinhood" },
  { company: "Brex", short: "BREX", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "brex" },
  { company: "Affirm", short: "AFRM", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "affirm" },
  { company: "Chime", short: "CHME", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "chime" },
  { company: "SoFi", short: "SOFI", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "sofi" },
  { company: "Betterment", short: "BTMT", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "betterment" },

  // ═══ TECHNOLOGY ══════════════════════════════════════════════════════════
  { company: "Anthropic", short: "ANTH", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "anthropic" },
  { company: "Databricks", short: "DBX", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "databricks" },
  { company: "Datadog", short: "DDOG", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "datadog" },
  { company: "Cloudflare", short: "NET", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "cloudflare" },
  { company: "MongoDB", short: "MDB", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "mongodb" },
  { company: "Figma", short: "FIG", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "figma" },
  { company: "Reddit", short: "RDDT", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "reddit" },
  { company: "Pinterest", short: "PINS", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "pinterest" },
  { company: "Lyft", short: "LYFT", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "lyft" },
  { company: "Dropbox", short: "DBX2", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "dropbox" },
  { company: "Asana", short: "ASAN", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "asana" },
  { company: "Discord", short: "DISC", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "discord" },
  { company: "Twitch", short: "TWCH", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "twitch" },
  { company: "Roblox", short: "RBLX", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "roblox" },
  { company: "Instacart", short: "CART", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "instacart" },
  { company: "Samsara", short: "IOT", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "samsara" },
  { company: "Gusto", short: "GSTO", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "gusto" },
  { company: "GitLab", short: "GTLB", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "gitlab" },
  { company: "Elastic", short: "ESTC", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "elastic" },
  { company: "Vercel", short: "VRCL", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "vercel" },
  { company: "Toast", short: "TOST", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "toast" },
  { company: "Squarespace", short: "SQSP", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "squarespace" },
  { company: "Scale AI", short: "SCAL", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "scaleai" },
  { company: "Airtable", short: "ATBL", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "airtable" },
  { company: "Palantir", short: "PLTR", logoClass: "pltr", field: "Technology", ats: "lever", board: "palantir" },
  // Gaming
  { company: "Epic Games", short: "EPIC", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "epicgames" },
  { company: "Riot Games", short: "RIOT", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "riotgames" },

  // ═══ CONSULTING ══════════════════════════════════════════════════════════
  { company: "ThoughtWorks", short: "TW", logoClass: "consult", field: "Consulting", subField: "Tech Consulting", ats: "greenhouse", board: "thoughtworks" },
  { company: "Charles River Associates", short: "CRA", logoClass: "consult", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "charlesriverassociates" },

  // ═══ HEALTHCARE / BIOTECH ════════════════════════════════════════════════
  { company: "Ginkgo Bioworks", short: "DNA", logoClass: "health", field: "Healthcare", ats: "greenhouse", board: "ginkgobioworks" },
  { company: "Recursion", short: "RXRX", logoClass: "health", field: "Healthcare", ats: "greenhouse", board: "recursionpharmaceuticals" },

  // ═══ EDUCATION ═══════════════════════════════════════════════════════════
  { company: "Khan Academy", short: "KA", logoClass: "edu", field: "Education", ats: "greenhouse", board: "khanacademy" },
  { company: "Duolingo", short: "DUO", logoClass: "edu", field: "Education", ats: "greenhouse", board: "duolingo" },

  // ═══ ADDED: more verified feeds ══════════════════════════════════════════
  // Finance — quant / hedge funds
  { company: "Optiver", short: "OPTV", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "optiverus" },
  { company: "Chicago Trading (CTC)", short: "CTC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "chicagotrading" },
  { company: "Schonfeld", short: "SCHF", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "schonfeld" },
  { company: "Vatic Labs", short: "VATC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "vaticlabs" },
  { company: "Marshall Wace", short: "MW", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "marshallwace" },
  // Finance — fintech
  { company: "Nubank", short: "NU", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "nubank" },
  // Technology
  { company: "DoorDash", short: "DASH", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "doordashusa" },
  { company: "Postman", short: "PSTM", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "postman" },
  { company: "LaunchDarkly", short: "LD", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "launchdarkly" },
  { company: "CockroachDB", short: "CRDB", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "cockroachlabs" },
  { company: "Webflow", short: "WFLO", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "webflow" },
  { company: "Checkr", short: "CHKR", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "checkr" },
  { company: "Amplitude", short: "AMPL", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "amplitude" },
  { company: "Mixpanel", short: "MIXP", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "mixpanel" },
  // Healthcare / biotech
  { company: "Flatiron Health", short: "FLAT", logoClass: "health", field: "Healthcare", ats: "greenhouse", board: "flatironhealth" },

  // Broader student coverage across underrepresented fields
  { company: "Anduril Industries", short: "AND", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "greenhouse", board: "andurilindustries" },
  { company: "Zipline", short: "ZIP", logoClass: "eng", field: "Engineering", subField: "Robotics", ats: "greenhouse", board: "flyzipline" },
  { company: "Vox Media", short: "VOX", logoClass: "media", field: "Media", subField: "Digital Media", ats: "greenhouse", board: "voxmedia" },
  { company: "Wikimedia Foundation", short: "WIKI", logoClass: "npo", field: "Nonprofit", subField: "Technology & Knowledge", ats: "greenhouse", board: "wikimedia" },
  { company: "Oscar Health", short: "OSCR", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "oscar" },
  { company: "Glossier", short: "GLOS", logoClass: "consumer", field: "Consumer", subField: "Beauty", ats: "greenhouse", board: "glossier" },
  { company: "Coursera", short: "COUR", logoClass: "edu", field: "Education", subField: "Education Technology", ats: "greenhouse", board: "coursera" },
  { company: "The Athletic", short: "ATH", logoClass: "media", field: "Sports", subField: "Sports Media", ats: "lever", board: "theathletic" },
  { company: "VTS", short: "VTS", logoClass: "consumer", field: "Real Estate", subField: "Property Technology", ats: "greenhouse", board: "vts" },

  // ═══ ADDED Jul 2026: probed + identity-verified boards ═══════════════════
  { company: "SpaceX", short: "SPX", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "greenhouse", board: "spacex" },
  { company: "Relativity Space", short: "RLTY", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "greenhouse", board: "relativity" },
  { company: "Airbnb", short: "ABNB", logoClass: "tech", field: "Technology", ats: "greenhouse", board: "airbnb" },
  { company: "Spotify", short: "SPOT", logoClass: "media", field: "Media", subField: "Digital Media", ats: "lever", board: "spotify" },
  { company: "Zocdoc", short: "ZD", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "zocdoc" },
  { company: "Komodo Health", short: "KMDO", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "komodohealth" },
  { company: "Sweetgreen", short: "SG", logoClass: "consumer", field: "Consumer", subField: "Food & Beverage", ats: "greenhouse", board: "sweetgreen" },
  { company: "Code for America", short: "CFA", logoClass: "npo", field: "Nonprofit", subField: "Civic Technology", ats: "greenhouse", board: "codeforamerica" },
];

module.exports = { SOURCES };

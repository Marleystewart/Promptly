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
// Ashby:      { ats:"ashby", board:"<token>" }        (jobs.ashbyhq.com/<token>)
// SmartRecruiters: { ats:"smartrecruiters", board:"<CompanyIdentifier>" }
//             (jobs.smartrecruiters.com/<CompanyIdentifier>/...)
// Flo Recruit:{ ats:"florecruit", board:"<org-friendly-name>" }
//             (florecruit.com/v2/app/<org-friendly-name>/jobs)
// Custom:     { ats:"custom", handler:"<filename>" } — for a company with NO
//             feed on any system above. Runs company-scrapers/<filename>.js.
//             See company-scrapers/_template.js before adding one of these;
//             it's the expensive fallback, not the default.
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
  { company: "AQR Capital", short: "AQR", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "aqr" },
  { company: "Verition", short: "VER", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "veritiongroupllc" },
  { company: "Citadel", short: "CITA", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "custom", handler: "citadel" },
  { company: "Millennium", short: "MLP", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "custom", handler: "millennium", studentBoard: true },
  { company: "Balyasny", short: "BAM", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "custom", handler: "balyasny" },
  { company: "D. E. Shaw", short: "DES", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "custom", handler: "deshaw" },
  // Quant trading / market makers
  { company: "IMC Trading", short: "IMC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "imc" },
  { company: "Akuna Capital", short: "AKU", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "akunacapital" },
  { company: "Flow Traders", short: "FLOW", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "flowtraders" },
  { company: "Old Mission", short: "OMC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "oldmissioncapital" },
  { company: "Five Rings", short: "5R", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "fiveringsllc" },
  { company: "Hudson River Trading", short: "HRT", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "wehrtyou" },
  { company: "Two Sigma", short: "2Σ", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "custom", handler: "twosigma" },
  // Private equity / asset management
  { company: "General Atlantic", short: "GA", logoClass: "ga", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "generalatlantic" },
  { company: "Bain Capital", short: "BCap", logoClass: "bcap", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "baincapital", dc: "wd1", site: "External_Public" },
  { company: "Blackstone", short: "BX", logoClass: "bx", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "blackstone", dc: "wd1", site: "Blackstone_Campus_Careers" },
  { company: "Ares Management", short: "ARES", logoClass: "ares", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "aresmgmt", dc: "wd1", site: "external" },
  { company: "Wellington Management", short: "WELL", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "wellington", dc: "wd5", site: "External" },
  { company: "Vanguard", short: "VANG", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "vanguard", dc: "wd5", site: "vanguard_external" },
  { company: "T. Rowe Price", short: "TROW", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "troweprice", dc: "wd5", site: "TRowePrice" },
  { company: "Invesco", short: "IVZ", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "invesco", dc: "wd1", site: "IVZ" },
  { company: "Franklin Templeton", short: "BEN", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "franklintempleton", dc: "wd5", site: "Primary-External-1" },
  { company: "PIMCO", short: "PIM", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "pimco", dc: "wd1", site: "pimco-careers" },
  { company: "AllianceBernstein", short: "AB", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "abglobal", dc: "wd1", site: "abcampuscareers", studentBoard: true },
  { company: "Neuberger Berman", short: "NB", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "nb", dc: "wd1", site: "NBCareers" },
  { company: "Dodge & Cox", short: "D&C", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "dodgeandcox", dc: "wd5", site: "dodgecox" },
  { company: "Charles Schwab", short: "SCHW", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "custom", handler: "charlesschwab" },
  { company: "Nuveen", short: "NUV", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "custom", handler: "nuveen" },
  { company: "Lord Abbett", short: "LA", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "custom", handler: "lordabbett", studentBoard: true },
  // Investment banking
  // Citi runs its own careers site (no supported ATS) — see company-scrapers/citi.js
  { company: "Citi", short: "C", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "citi" },
  { company: "JPMorgan", short: "JPM", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "jpmorgan" },
  // Goldman runs its own Next.js careers site (higher.gs.com), backed by a
  // public GraphQL feed — see company-scrapers/goldmansachs.js.
  { company: "Goldman Sachs", short: "GS", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "goldmansachs" },
  // studentBoard: this Workday site is PJT's students-only board, so campus
  // titles ("2027 Full Time Analyst") are trustworthy here. Never set this on
  // a general/experienced-hire board — see STUDENT_BOARD_TITLE in aggregator.js.
  { company: "PJT Partners", short: "PJT", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "pjtpartners", dc: "wd1", site: "students", studentBoard: true },
  { company: "State Street", short: "STT", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "statestreet", dc: "wd1", site: "Global" },
  { company: "William Blair", short: "WB", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "greenhouse", board: "williamblair" },
  { company: "Guggenheim Securities", short: "GUG", logoClass: "gug", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "guggenheim", dc: "wd1", site: "Guggenheim_Careers_Campus" },
  { company: "Houlihan Lokey", short: "HL", logoClass: "laz", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "hl", dc: "wd1", site: "Campus" },
  { company: "Moelis", short: "MC", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "moelis", dc: "wd1", site: "University-Hires", studentBoard: true },
  { company: "Raymond James", short: "RJF", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "raymondjames", dc: "wd1", site: "RaymondJamesEarlyCareers" },
  { company: "Rothschild & Co", short: "R&CO", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "rothschildandco", dc: "wd3", site: "RothschildAndCo_Lateral" },
  { company: "Baird", short: "BAIRD", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "baird" },
  { company: "Stifel", short: "SF", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "stifel" },
  // Consumer and regional banks with first-party Workday feeds.
  { company: "Capital One", short: "COF", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "capitalone", dc: "wd12", site: "capital_one" },
  { company: "American Express", short: "AXP", logoClass: "fin", field: "Finance", subField: "Banking", ats: "custom", handler: "americanexpress" },
  { company: "Synchrony", short: "SYF", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "synchronyfinancial", dc: "wd5", site: "university", studentBoard: true },
  { company: "Fifth Third Bank", short: "FITB", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "fifththird", dc: "wd5", site: "53careers" },
  { company: "KeyBank", short: "KEY", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "keybank", dc: "wd5", site: "External_Career_Site" },
  { company: "Regions Bank", short: "RF", logoClass: "fin", field: "Finance", subField: "Banking", ats: "custom", handler: "regions" },
  { company: "Citizens", short: "CFG", logoClass: "fin", field: "Finance", subField: "Banking", ats: "custom", handler: "citizens" },
  { company: "Huntington Bank", short: "HBAN", logoClass: "fin", field: "Finance", subField: "Banking", ats: "custom", handler: "huntington", studentBoard: true },
  { company: "Truist", short: "TFC", logoClass: "fin", field: "Finance", subField: "Banking", ats: "custom", handler: "truist" },
  { company: "M&T Bank", short: "MTB", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "mtb", dc: "wd5", site: "Campus", studentBoard: true },
  // Fintech (consumer finance)
  { company: "Stripe", short: "STRP", logoClass: "stripe", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "stripe" },
  { company: "Coinbase", short: "COIN", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "coinbase" },
  { company: "Robinhood", short: "HOOD", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "robinhood" },
  { company: "Brex", short: "BREX", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "brex" },
  { company: "Affirm", short: "AFRM", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "affirm" },
  { company: "Chime", short: "CHME", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "chime" },
  { company: "SoFi", short: "SOFI", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "sofi" },
  { company: "Betterment", short: "BTMT", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "betterment" },
  { company: "Interactive Brokers", short: "IBKR", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "custom", handler: "interactivebrokers" },

  // ═══ ADDED Aug 2026 (trey/finance-completeness): major-firm coverage ══════
  // Each probed live before adding. Big global boards mostly return 0 US
  // student roles today (fall campus season) but activate the hour one posts.
  // Hedge funds / prop trading (Greenhouse)
  { company: "ExodusPoint", short: "EXPT", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "exoduspoint" },
  { company: "Man Group", short: "EMG", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "mangroup" },
  { company: "Geneva Trading", short: "GVA", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "genevatrading" },
  { company: "DV Trading", short: "DV", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "dvtrading" },
  // Fintech
  { company: "Block", short: "XYZ", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "block" },
  // Private equity / banking / exchanges (Workday tenants from careers redirects)
  { company: "Apollo Global Management", short: "APO", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "athene", dc: "wd5", site: "Apollo_Careers" },
  { company: "U.S. Bank", short: "USB", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "usbank", dc: "wd1", site: "US_Bank_Careers" },
  // Hedge funds
  { company: "Lone Pine Capital", short: "LP", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "lonepinecapital" },
  { company: "Holocene Advisors", short: "HOL", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "holoceneadvisors" },
  { company: "Winton", short: "WIN", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "winton" },
  // Prop / quant
  { company: "TransMarket Group", short: "TMG", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "transmarketgroup" },
  { company: "Gelber Group", short: "GEL", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "gelbergroup" },
  // Susquehanna (SIG) — Jibe careers site fronting iCIMS; custom scraper reads
  // its /api/jobs endpoint. See company-scrapers/susquehanna.js + jibe.js.
  { company: "Susquehanna (SIG)", short: "SIG", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "custom", handler: "susquehanna" },
  // BlackRock runs a Radancy careers site — custom scraper via api/_shared/radancy.js.
  { company: "BlackRock", short: "BLK", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "custom", handler: "blackrock" },
  // Mastercard — Phenom careers site (global), custom scraper keeps US-only. See
  // company-scrapers/mastercard.js + phenom.js fetchPhenomWidgets + us-location.js.
  { company: "Mastercard", short: "MA", logoClass: "fin", field: "Finance", subField: "Payments", ats: "custom", handler: "mastercard" },
  { company: "Fiserv", short: "FI", logoClass: "fin", field: "Finance", subField: "Payments", ats: "custom", handler: "fiserv" },
  { company: "FIS", short: "FIS", logoClass: "fin", field: "Finance", subField: "Payments", ats: "custom", handler: "fisglobal" },
  { company: "Bread Financial", short: "BFH", logoClass: "fin", field: "Finance", subField: "Payments", ats: "custom", handler: "breadfinancial" },
  { company: "MassMutual", short: "MM", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "massmutual" },
  // Private equity / credit
  // Moved off Greenhouse — boards-api returned 404 for sixthstreet and every
  // variant. The live board is a Workday iframe on /current-opportunities/,
  // which is only visible once that page's JavaScript runs.
  { company: "Sixth Street", short: "6ST", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "sixthstreet", dc: "wd1", site: "sixthstreetcareers" },
  { company: "KKR", short: "KKR", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "stage" },
  { company: "Carlyle", short: "CG", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "carlyle", dc: "wd1", site: "Carlyle" },
  { company: "Blue Owl", short: "OWL", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "blueowl", dc: "wd1", site: "blueowl" },
  { company: "Piper Sandler", short: "PIPR", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "pipersandler", dc: "wd501", site: "Piper_Sandler_Careers" },
  { company: "GTCR", short: "GTCR", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "gtcr" },
  // Asset management
  { company: "Artisan Partners", short: "APAM", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "greenhouse", board: "artisanpartners" },
  // Advisory / boutique investment banks
  { company: "Lincoln International", short: "LINC", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "greenhouse", board: "lincolninternational" },
  { company: "LionTree", short: "LT", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "greenhouse", board: "liontree" },
  // More PE + asset managers (Greenhouse + Workday tenants from careers pages)
  { company: "TPG", short: "TPG", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "tpgcareers" },
  { company: "Northern Trust", short: "NTRS", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "ntrs", dc: "wd1", site: "northerntrust" },
  { company: "Ameriprise Financial", short: "AMP", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "ameriprise", dc: "wd5", site: "Ameriprise" },
  { company: "Guggenheim Investments", short: "GGM", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "guggenheiminvestment", dc: "wd5", site: "External" },
  { company: "PGIM", short: "PGIM", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "pru", dc: "wd5", site: "PGIM_Careers" },

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
  // Boards verified live and responding. Campus reqs open Sept–Nov, so most
  // of these legitimately return 0 in August — the value is catching the
  // season the moment it opens, not padding today's count.
  { company: "Natera", short: "NTRA", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "natera" },
  { company: "Benchling", short: "BNCH", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "ashby", board: "benchling" },
  { company: "Headway", short: "HDWY", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "ashby", board: "headway" },
  { company: "Insitro", short: "INSI", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "ashby", board: "insitro" },

  // ═══ EDUCATION ═══════════════════════════════════════════════════════════
  { company: "Khan Academy", short: "KA", logoClass: "edu", field: "Education", ats: "greenhouse", board: "khanacademy" },
  { company: "Duolingo", short: "DUO", logoClass: "edu", field: "Education", ats: "greenhouse", board: "duolingo" },

  // ═══ ADDED: more verified feeds ══════════════════════════════════════════
  // Finance — quant / hedge funds
  { company: "Optiver", short: "OPTV", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "optiverus" },
  { company: "Chicago Trading (CTC)", short: "CTC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "chicagotrading" },
  { company: "Schonfeld", short: "SCHF", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "schonfeld" },
  { company: "Vatic Labs", short: "VATC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "vaticlabs" },
  { company: "Marshall Wace", short: "MW", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "mwinternshipprogram", studentBoard: true },
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
  { company: "Axios", short: "AXIO", logoClass: "media", field: "Media", subField: "News", ats: "greenhouse", board: "axios" },
  { company: "Hearst", short: "HRST", logoClass: "media", field: "Media", subField: "News", ats: "greenhouse", board: "hearst" },
  { company: "Fox", short: "FOX", logoClass: "media", field: "Media", subField: "Entertainment", ats: "greenhouse", board: "fox" },
  { company: "Substack", short: "SUBS", logoClass: "media", field: "Media", subField: "Digital Media", ats: "ashby", board: "substack" },
  { company: "Patreon", short: "PTRN", logoClass: "media", field: "Media", subField: "Digital Media", ats: "ashby", board: "patreon" },
  { company: "Waymo", short: "WAYM", logoClass: "eng", field: "Engineering", subField: "Robotics", ats: "greenhouse", board: "waymo" },
  { company: "Zoox", short: "ZOOX", logoClass: "eng", field: "Engineering", subField: "Robotics", ats: "lever", board: "zoox" },
  { company: "Nuro", short: "NURO", logoClass: "eng", field: "Engineering", subField: "Robotics", ats: "greenhouse", board: "nuro" },
  { company: "Lucid Motors", short: "LCID", logoClass: "eng", field: "Engineering", subField: "Automotive", ats: "greenhouse", board: "lucidmotors" },
  { company: "Shield AI", short: "SHLD", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "ashby", board: "shield-ai" },
  { company: "Gopuff", short: "GPUF", logoClass: "consumer", field: "Consumer", subField: "Retail", ats: "lever", board: "gopuff" },
  { company: "Wikimedia Foundation", short: "WIKI", logoClass: "npo", field: "Nonprofit", subField: "Technology & Knowledge", ats: "greenhouse", board: "wikimedia" },
  // Board name verified as "Medecins Sans Frontieres (Doctors Without Borders)
  // - United States" via /v1/boards/msfcareers, not assumed from the token.
  { company: "Doctors Without Borders", short: "MSF", logoClass: "npo", field: "Nonprofit", subField: "Humanitarian", ats: "greenhouse", board: "msfcareers" },
  { company: "Oscar Health", short: "OSCR", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "oscar" },
  { company: "GSK", short: "GSK", logoClass: "health", field: "Healthcare", subField: "Pharmaceuticals", ats: "custom", handler: "gsk" },
  { company: "Genentech", short: "GENE", logoClass: "health", field: "Healthcare", subField: "Biotechnology", ats: "custom", handler: "genentech" },
  { company: "Humana", short: "HUM", logoClass: "health", field: "Healthcare", subField: "Health Insurance", ats: "custom", handler: "humana" },
  { company: "NBA", short: "NBA", logoClass: "media", field: "Sports", subField: "Teams & Leagues", ats: "custom", handler: "nba" },
  { company: "Qualcomm", short: "QCOM", logoClass: "tech", field: "Technology", subField: "Semiconductors", ats: "custom", handler: "qualcomm" },
  { company: "Ford", short: "F", logoClass: "eng", field: "Engineering", subField: "Automotive", ats: "custom", handler: "ford" },
  { company: "Mayo Clinic", short: "MAYO", logoClass: "health", field: "Healthcare", subField: "Hospital Systems", ats: "custom", handler: "mayoclinic" },
  { company: "EY", short: "EY", logoClass: "consult", field: "Consulting", subField: "Big 4", ats: "custom", handler: "ey" },
  { company: "ExxonMobil", short: "XOM", logoClass: "eng", field: "Engineering", subField: "Energy", ats: "custom", handler: "exxonmobil" },
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

  // ═══ ADDED Jul 2026: Ashby boards (probed + identity-verified) ═══════════
  { company: "OpenAI", short: "OAI", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "openai" },
  { company: "Ramp", short: "RAMP", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "ramp" },
  { company: "Notion", short: "NTN", logoClass: "tech", field: "Technology", ats: "ashby", board: "notion" },
  { company: "Linear", short: "LNR", logoClass: "tech", field: "Technology", ats: "ashby", board: "linear" },
  { company: "Vanta", short: "VNTA", logoClass: "tech", field: "Technology", ats: "ashby", board: "vanta" },
  { company: "Replit", short: "RPLT", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "replit" },
  { company: "Cohere", short: "CO", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "cohere" },
  { company: "Modal", short: "MODL", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "modal" },
  { company: "Supabase", short: "SUPA", logoClass: "tech", field: "Technology", ats: "ashby", board: "supabase" },
  { company: "ElevenLabs", short: "11L", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "elevenlabs" },
  { company: "Cursor (Anysphere)", short: "CURS", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "cursor" },
  { company: "Sierra", short: "SIRA", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "sierra" },
  { company: "Harvey", short: "HRVY", logoClass: "law", field: "Law", subField: "Legal Technology", ats: "ashby", board: "harvey" },
  { company: "Writer", short: "WRTR", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "writer" },

  // ═══ ADDED Jul 2026: SmartRecruiters boards (probed + identity-verified) ═
  { company: "Visa", short: "V", logoClass: "fin", field: "Finance", subField: "Payments", ats: "smartrecruiters", board: "Visa" },
  { company: "ServiceNow", short: "NOW", logoClass: "tech", field: "Technology", ats: "smartrecruiters", board: "ServiceNow" },
  { company: "Experian", short: "EXPN", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "smartrecruiters", board: "Experian" },
  { company: "Ubisoft", short: "UBI", logoClass: "tech", field: "Technology", subField: "Gaming", ats: "smartrecruiters", board: "Ubisoft2" },
  { company: "Continental", short: "CONTI", logoClass: "eng", field: "Engineering", subField: "Automotive", ats: "smartrecruiters", board: "Continental" },

  // ═══ CONSUMER / CPG EXPANSION (verified August 2026) ════════════════════
  // These Workday tenants are global, so positiveUsOnly requires affirmative
  // US location evidence instead of trusting an incomplete foreign-city list.
  { company: "Procter & Gamble", short: "PG", logoClass: "consumer", field: "Consumer", subField: "Consumer Products", ats: "workday", tenant: "pg", dc: "wd5", site: "1000", positiveUsOnly: true },
  { company: "Nike", short: "NKE", logoClass: "consumer", field: "Consumer", subField: "Apparel", ats: "workday", tenant: "nike", dc: "wd1", site: "nke", positiveUsOnly: true },
  { company: "Mondelez", short: "MDLZ", logoClass: "consumer", field: "Consumer", subField: "Food & Beverage", ats: "workday", tenant: "mdlz", dc: "wd3", site: "External", positiveUsOnly: true },
  { company: "Kraft Heinz", short: "KHC", logoClass: "consumer", field: "Consumer", subField: "Food & Beverage", ats: "workday", tenant: "heinz", dc: "wd1", site: "KraftHeinz_Careers", positiveUsOnly: true },
  { company: "General Mills", short: "GIS", logoClass: "consumer", field: "Consumer", subField: "Food & Beverage", ats: "workday", tenant: "genmills", dc: "wd1", site: "GMI_External_Careers", positiveUsOnly: true },
  { company: "Unilever", short: "UL", logoClass: "consumer", field: "Consumer", subField: "Consumer Products", ats: "custom", handler: "unilever" },
  { company: "PepsiCo", short: "PEP", logoClass: "consumer", field: "Consumer", subField: "Food & Beverage", ats: "custom", handler: "pepsico" },
  { company: "Adidas", short: "ADS", logoClass: "consumer", field: "Consumer", subField: "Apparel", ats: "custom", handler: "adidas" },
  { company: "L'Oréal", short: "OR", logoClass: "consumer", field: "Consumer", subField: "Beauty", ats: "custom", handler: "loreal" },
  { company: "Estée Lauder", short: "EL", logoClass: "consumer", field: "Consumer", subField: "Beauty", ats: "custom", handler: "esteelauder" },

  // ═══ REAL ESTATE EXPANSION (verified August 2026) ═══════════════════════
  { company: "JLL", short: "JLL", logoClass: "consumer", field: "Real Estate", subField: "Commercial Real Estate", ats: "workday", tenant: "jll", dc: "wd1", site: "jllcareers", positiveUsOnly: true },
  { company: "Cushman & Wakefield", short: "CWK", logoClass: "consumer", field: "Real Estate", subField: "Commercial Real Estate", ats: "workday", tenant: "cw", dc: "wd1", site: "External", positiveUsOnly: true },
  { company: "Colliers", short: "CIGI", logoClass: "consumer", field: "Real Estate", subField: "Commercial Real Estate", ats: "workday", tenant: "colliers", dc: "wd3", site: "Colliers-External-Career-Site", positiveUsOnly: true },
  { company: "Prologis", short: "PLD", logoClass: "consumer", field: "Real Estate", subField: "Industrial Real Estate", ats: "workday", tenant: "prologis", dc: "wd5", site: "Prologis_External_Careers", positiveUsOnly: true },

  // ═══ LAW EXPANSION — Flo Recruit (verified August 2026) ═════════════════
  // Each token was identity-checked against Flo's public display-name API.
  // Most summer-associate boards are legitimately empty in August; these
  // activate automatically as firms publish their next campus cycle.
  { company: "Gibson Dunn", short: "GD", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "gibsondunn" },
  { company: "Kirkland & Ellis", short: "KE", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "kirkland" },
  { company: "Latham & Watkins", short: "LW", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "latham" },
  { company: "Skadden", short: "SK", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "skadden" },
  { company: "Sidley Austin", short: "SA", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "sidley" },
  { company: "White & Case", short: "WC", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "whitecase" },
  { company: "Jones Day", short: "JD", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "jonesday" },
  { company: "Davis Polk", short: "DP", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "davispolk" },
  { company: "Sullivan & Cromwell", short: "SC", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "sullcrom" },
  { company: "Simpson Thacher", short: "STB", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "stblaw" },
  { company: "Cravath", short: "CRV", logoClass: "law", field: "Law", subField: "Big Law", ats: "florecruit", board: "cravath" },

  // ═══ GOVERNMENT: USAJOBS (all federal agencies, one adapter) ═════════════
  // Needs free USAJOBS_API_KEY + USAJOBS_EMAIL in Vercel. No-ops until set.
  // The HiringPath filter scopes to student + recent-graduate roles across
  // every agency; each result surfaces the real hiring agency (NASA, State,
  // NIH…) as the company.
  { company: "U.S. Federal Government", short: "GOV", logoClass: "gov", field: "Government", subField: "Federal", ats: "usajobs", hiringPath: "student;recent-graduates" },

  // The Federal Reserve is NOT on USAJOBS — the Board and the twelve Reserve
  // Banks hire independently of the federal civil service. The Board runs
  // Oracle Taleo; see _shared/taleo.js. Verified live: the section parses and
  // returns real reqs with the employer's own posting dates. It carries no
  // student roles at the time of adding (Fed internships post in the autumn
  // for the following summer), so this contributes nothing until they open —
  // which is the point of adding it now rather than in November.
  { company: "Federal Reserve Board", short: "FRB", logoClass: "gov", field: "Government", subField: "Central Banking", ats: "taleo", tenant: "frbog", section: "1" },


  // ═══ PLACEHOLDER CONVERSIONS ══════════════════════════════════════════════
  // These employers previously showed a "no verified posting yet" card because
  // Promptly could not read them. Each board below was probed live AND had its
  // identity confirmed against the board's own stated name — a resolving slug
  // is not proof of ownership: "greenhouse:general" answers for neither GM nor
  // GE, ashby:silver is Silver.dev, ashby:eli is Eli Health, and lever:blue is
  // BlueCloud. Those were all rejected rather than guessed at.
  { company: "Snowflake", short: "SNOW", logoClass: "tech", field: "Technology", subField: "Enterprise Software", ats: "ashby", board: "snowflake" },
  { company: "Plaid", short: "PLD", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "plaid" },
  { company: "WPP", short: "WPP", logoClass: "mkt", field: "Marketing", subField: "Advertising", ats: "greenhouse", board: "wpp" },
  { company: "Ogilvy", short: "OGV", logoClass: "mkt", field: "Marketing", subField: "Advertising", ats: "greenhouse", board: "ogilvy" },
  { company: "Roland Berger", short: "RB", logoClass: "consult", field: "Consulting", subField: "Strategy", ats: "smartrecruiters", board: "rolandberger" },
  { company: "Enova International", short: "ENVA", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "enova" },
  { company: "Bottomline Technologies", short: "EPAY", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "bottomlinetechnologies" },
  { company: "Blend", short: "BLND", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "blend" },
  { company: "Prosper Marketplace", short: "PRSP", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "lever", board: "prosper" },
  { company: "Audax Private Equity", short: "AUD", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "audaxprivateequity" },
  { company: "Roark Capital Group", short: "ROARK", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "roarkcapitalgroup" },
  { company: "American Securities", short: "AS", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "americansecurities" },
  { company: "LoanCore Capital", short: "LC2", logoClass: "fin", field: "Finance", subField: "Private Credit", ats: "greenhouse", board: "loancore" },
  { company: "FS Investments", short: "FS", logoClass: "fin", field: "Finance", subField: "Private Credit", ats: "smartrecruiters", board: "fsinvestments" },
  { company: "Paul, Weiss", short: "PW", logoClass: "law", field: "Law", subField: "Corporate Law", ats: "greenhouse", board: "paulweiss" },
  { company: "Brookings Institution", short: "BROOK", logoClass: "gov", field: "Government", subField: "Policy Research", ats: "lever", board: "brookings" },
  { company: "Uber", short: "UBER", logoClass: "tech", field: "Technology", subField: "Consumer Internet", ats: "smartrecruiters", board: "uber" },

  // ═══ WORKDAY PLACEHOLDER CONVERSIONS ══════════════════════════════════════
  // Workday needs tenant + datacenter + site, and the site name is almost
  // always bespoke ("Blackstone_Campus_Careers", "vanguard_external"), so
  // guessing it is hopeless. Every config below was READ OFF the employer's
  // own careers page — the myworkdayjobs.com URL they link to carries all
  // three values — and then probed against the live feed, because a scraped
  // URL can still be a bad parse (Green Dot yielded the locale "en-us" rather
  // than a site name, and was dropped).
  { company: "LendingClub", short: "LC", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "lendingclub", dc: "wd1", site: "External" },
  { company: "Broadridge Financial", short: "BR", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "broadridge", dc: "wd5", site: "Careers" },
  { company: "Temenos", short: "TEMN", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "temenos", dc: "wd103", site: "Temenoscareers" },
  { company: "Antares Capital", short: "ANT", logoClass: "fin", field: "Finance", subField: "Private Credit", ats: "workday", tenant: "antares", dc: "wd5", site: "antares" },
  { company: "Workday", short: "WDAY", logoClass: "tech", field: "Technology", ats: "workday", tenant: "workday", dc: "wd5", site: "Workday" },
  { company: "CrowdStrike", short: "CRWD", logoClass: "tech", field: "Technology", ats: "workday", tenant: "crowdstrike", dc: "wd5", site: "crowdstrikecareers" },
  { company: "Booz Allen Hamilton", short: "BAH", logoClass: "consult", field: "Consulting", subField: "Strategy", ats: "workday", tenant: "bah", dc: "wd1", site: "BAH_Jobs" },
  { company: "Huron", short: "HRN", logoClass: "consult", field: "Consulting", ats: "workday", tenant: "huron", dc: "wd1", site: "huroncareers" },
  { company: "Intel", short: "INTC", logoClass: "tech", field: "Technology", ats: "workday", tenant: "intel", dc: "wd1", site: "External" },
  { company: "Guidehouse", short: "GH", logoClass: "consult", field: "Consulting", ats: "workday", tenant: "guidehouse", dc: "wd1", site: "External" },
  { company: "Moderna", short: "MRNA", logoClass: "health", field: "Healthcare", ats: "workday", tenant: "modernatx", dc: "wd1", site: "M_tx" },
  { company: "Vertex Pharmaceuticals", short: "VRTX", logoClass: "health", field: "Healthcare", ats: "workday", tenant: "vrtx", dc: "wd501", site: "vertex_careers" },
  { company: "Cigna", short: "CI", logoClass: "health", field: "Healthcare", ats: "workday", tenant: "cigna", dc: "wd5", site: "cignacareers" },
  { company: "RAND Corporation", short: "RAND", logoClass: "gov", field: "Government", ats: "workday", tenant: "rand", dc: "wd5", site: "External_Career_Site" },
  { company: "Live Nation", short: "LYV", logoClass: "media", field: "Media", ats: "workday", tenant: "livenation", dc: "wd503", site: "LNExternalSite" },
  { company: "Dentsu", short: "DNTS", logoClass: "mkt", field: "Marketing", ats: "workday", tenant: "dentsuaegis", dc: "wd3", site: "DAN_GLOBAL" },
  { company: "Caterpillar", short: "CAT", logoClass: "eng", field: "Engineering", ats: "workday", tenant: "cat", dc: "wd5", site: "CaterpillarCareers" },
  { company: "Howard Hughes (HHMI)", short: "HHMI", logoClass: "sci", field: "Science", ats: "workday", tenant: "hhmi", dc: "wd1", site: "External" },
  { company: "Teach For America", short: "TFA", logoClass: "npo", field: "Nonprofit", ats: "workday", tenant: "teachforamerica", dc: "wd1", site: "TFA_Careers" },
  { company: "American Red Cross", short: "ARC", logoClass: "npo", field: "Nonprofit", ats: "workday", tenant: "americanredcross", dc: "wd1", site: "American_Red_Cross_Careers" },
  { company: "Gates Foundation", short: "GATES", logoClass: "npo", field: "Nonprofit", ats: "workday", tenant: "gatesfoundation", dc: "wd1", site: "Gates" },
  { company: "Habitat for Humanity", short: "HFH", logoClass: "npo", field: "Nonprofit", ats: "workday", tenant: "habitat", dc: "wd12", site: "External" },
  { company: "Wasserman", short: "WASS", logoClass: "mkt", field: "Sports", subField: "Sports Marketing", ats: "workday", tenant: "teamwass", dc: "wd5", site: "wassermancareers" },
  { company: "Zillow", short: "ZG", logoClass: "tech", field: "Real Estate", subField: "Property Technology", ats: "workday", tenant: "zillow", dc: "wd5", site: "Zillow_Group_External" },

  // ═══ COVERAGE EXPANSION ═══════════════════════════════════════════════════
  // Probed live before shipping. (A source returning 0 matches today is fine —
  // it activates the moment that employer posts a student role.)
  { company: "Keystone Strategy", short: "KEY", logoClass: "fin", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "keystonestrategy" },
  { company: "Peloton", short: "PTON", logoClass: "consumer", field: "Consumer", subField: "Fitness", ats: "greenhouse", board: "peloton" },

  // ═══ ENTERPRISE + NON-TECH COVERAGE (verified July 2026) ══════════════════
  // Every entry below was probed live before being added — see
  // scripts/probe-candidates.js and scripts/probe-workday.js. Large employers
  // mostly do NOT run public Greenhouse boards; they run Workday tenants, which
  // is why this block is Workday-heavy. Anything we could not verify was left
  // out rather than shipped as a company we can't actually watch.
  { company: "Nvidia", short: "NVDA", logoClass: "tech", field: "Technology", subField: "Semiconductors", ats: "workday", tenant: "nvidia", dc: "wd5", site: "NVIDIAExternalCareerSite" },
  { company: "Salesforce", short: "CRM", logoClass: "tech", field: "Technology", subField: "Enterprise Software", ats: "workday", tenant: "salesforce", dc: "wd12", site: "External_Career_Site" },
  { company: "Adobe", short: "ADBE", logoClass: "tech", field: "Technology", subField: "Enterprise Software", ats: "workday", tenant: "adobe", dc: "wd5", site: "external_experienced" },
  { company: "Okta", short: "OKTA", logoClass: "tech", field: "Technology", subField: "Security", ats: "greenhouse", board: "okta" },

  // Aerospace and defense — previously only startups (SpaceX, Anduril, Zipline).
  { company: "Boeing", short: "BA", logoClass: "eng", field: "Engineering", subField: "Aerospace", ats: "workday", tenant: "boeing", dc: "wd1", site: "EXTERNAL_CAREERS" },
  { company: "Northrop Grumman", short: "NOC", logoClass: "eng", field: "Engineering", subField: "Aerospace", ats: "workday", tenant: "ngc", dc: "wd1", site: "Northrop_Grumman_External_Site" },
  { company: "Rocket Lab", short: "RKLB", logoClass: "eng", field: "Engineering", subField: "Aerospace", ats: "greenhouse", board: "rocketlab" },

  // Healthcare — previously biotech/health-tech only, no payers or systems.
  { company: "CVS Health", short: "CVS", logoClass: "health", field: "Healthcare", subField: "Payers", ats: "workday", tenant: "cvshealth", dc: "wd1", site: "CVS_Health_Careers" },

  // ── Added Aug 2026 (trey/goldman-media-healthcare): large-cap biotech ─────
  // Workday tenants discovered from each company's real careers-page redirect,
  // then probed live (scripts/probe-workday.js pattern). All four boards
  // resolve and return real reqs; they have 0 US student roles *today* (their
  // only open interns are overseas — EU/APAC — in August, correctly filtered
  // out), so each activates the hour a US campus req posts, same as the rest of
  // the healthcare block above. Location format is "Country - City", which the
  // INTERNATIONAL guard catches cleanly (no ", XX" state-code collision).
  { company: "Amgen", short: "AMGN", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "workday", tenant: "amgen", dc: "wd1", site: "Careers" },
  { company: "Gilead Sciences", short: "GILD", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "workday", tenant: "gilead", dc: "wd1", site: "gileadcareers" },
  { company: "Biogen", short: "BIIB", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "workday", tenant: "biibhr", dc: "wd3", site: "external" },
  { company: "Illumina", short: "ILMN", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "workday", tenant: "illumina", dc: "wd1", site: "illumina-careers" },
  // ── Added Aug 2026 (trey/pharma-media-3): big pharma ──────────────────────
  // First-party Workday tenants, discovered from each careers-page redirect and
  // probed live. Big global boards, so most US campus reqs open in the fall;
  // these carry real US roles (e.g. BMS's Princeton, NJ summer intern) and no
  // international leaks at time of adding. NOTE: Novartis (novartis.wd3/
  // Novartis_Careers) was deliberately NOT added — its only open student role
  // was in Selangor, Malaysia, which slipped past aggregator.js's
  // international filter (that city wasn't in the INTERNATIONAL list — now
  // fixed, see aggregator.js). Add Novartis once someone re-verifies it live.
  { company: "Merck", short: "MRK", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "workday", tenant: "msd", dc: "wd5", site: "SearchJobs" },
  { company: "Pfizer", short: "PFE", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "workday", tenant: "pfizer", dc: "wd1", site: "PfizerCareers" },
  { company: "Bristol Myers Squibb", short: "BMY", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "workday", tenant: "bristolmyerssquibb", dc: "wd5", site: "BMS" },
  // Sanofi runs Radancy (jobs.sanofi.com) — shared parse in api/_shared/radancy.js.
  { company: "Sanofi", short: "SNY", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "custom", handler: "sanofi" },
  // J&J's careers.jnj.com marketing site bot-walls scrapers (403), but the
  // underlying ATS is a first-party Workday tenant (jj.wd5/JJ) that serves the
  // same reqs and is reachable directly.
  { company: "Johnson & Johnson", short: "JNJ", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "workday", tenant: "jj", dc: "wd5", site: "JJ" },
  // Global pharma boards that leak non-US roles past aggregator.js's
  // international blocklist (bare foreign cities like "Selangor", or countries
  // not on the list like Bangladesh). Each is a custom scraper that reads the
  // employer's own feed and keeps only positively-confirmed US roles — see
  // api/_shared/us-location.js. Novartis=Workday, Roche=Phenom, AbbVie=Attrax.
  { company: "Novartis", short: "NVS", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "custom", handler: "novartis" },
  { company: "Roche", short: "RHHBY", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "custom", handler: "roche" },
  { company: "AbbVie", short: "ABBV", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "custom", handler: "abbvie" },

  // Media and entertainment — previously two sources total.
  { company: "Comcast NBCUniversal", short: "CMCSA", logoClass: "media", field: "Media", subField: "Entertainment", ats: "workday", tenant: "comcast", dc: "wd5", site: "Comcast_Careers" },
  // Added Aug 2026 (trey/media-healthcare-2). Warner Bros. Discovery runs a
  // first-party Workday tenant (warnerbros.wd5/global) — its Phenom careers
  // front-end just links out to these same Workday reqs, so we read Workday
  // directly. Netflix runs Eightfold, which has no ATS adapter, so it needs a
  // custom scraper — see company-scrapers/netflix.js.
  { company: "Warner Bros. Discovery", short: "WBD", logoClass: "media", field: "Media", subField: "Entertainment", ats: "workday", tenant: "warnerbros", dc: "wd5", site: "global" },
  { company: "Netflix", short: "NFLX", logoClass: "media", field: "Media", subField: "Streaming", ats: "custom", handler: "netflix" },
  // Disney runs Radancy (jobs.disneycareers.com) — no JSON ATS feed, so a
  // custom scraper parses its server-rendered search HTML, which carries full
  // "City, State, Country" locations. See company-scrapers/disney.js.
  { company: "Disney", short: "DIS", logoClass: "media", field: "Media", subField: "Entertainment", ats: "custom", handler: "disney" },
  { company: "Sony Pictures", short: "SPE", logoClass: "media", field: "Media", subField: "Entertainment", ats: "custom", handler: "sonypictures" },
  // Paramount runs j2w / SuccessFactors RMK (careers.paramount.com); custom
  // scraper reads the server-rendered results. See company-scrapers/paramount.js.
  { company: "Paramount", short: "PARA", logoClass: "media", field: "Media", subField: "Entertainment", ats: "custom", handler: "paramount" },
  { company: "The New York Times", short: "NYT", logoClass: "media", field: "Media", subField: "News", ats: "greenhouse", board: "thenewyorktimes" },

  // Consumer retail at household-name scale.
  { company: "Target", short: "TGT", logoClass: "consumer", field: "Consumer", subField: "Retail", ats: "workday", tenant: "target", dc: "wd5", site: "targetcareers" },

  // Education.
  { company: "Udemy", short: "UDMY", logoClass: "edu", field: "Education", subField: "EdTech", ats: "greenhouse", board: "udemy" },

  // ── Added by the 2026-08 backend audit ────────────────────────────────
  // Board tokens were NOT guessed. Each was derived from a real apply URL in
  // the summer-2027-internships repository by running it through the existing
  // detectSource() parser, then probed with the production fetcher — only
  // sources that actually returned US student roles are listed here.
  // Guessing tokens by company name had a 3/23 hit rate; this had 16/19.
  { company: "PNC Financial Services", short: "PNC", logoClass: "fin", field: "Finance", subField: "Banking", ats: "workday", tenant: "pnc", dc: "wd5", site: "External" },
  { company: "Western Digital", short: "WDC", logoClass: "tech", field: "Technology", subField: "Semiconductors", ats: "smartrecruiters", board: "WesternDigital" },
  { company: "The Trade Desk", short: "TTD", logoClass: "tech", field: "Technology", subField: "AdTech", ats: "greenhouse", board: "thetradedesk" },
  { company: "Neuralink", short: "NLNK", logoClass: "tech", field: "Technology", subField: "Neurotech", ats: "greenhouse", board: "neuralink" },
  { company: "Netic", short: "NTC", logoClass: "tech", field: "Technology", subField: "AI", ats: "ashby", board: "netic" },
  { company: "Skydio", short: "SKY", logoClass: "eng", field: "Engineering", subField: "Robotics", ats: "ashby", board: "skydio" },
  { company: "Blue Origin", short: "BO", logoClass: "eng", field: "Engineering", subField: "Aerospace", ats: "workday", tenant: "blueorigin", dc: "wd5", site: "BlueOrigin" },
  { company: "Solar Turbines", short: "SOLT", logoClass: "eng", field: "Engineering", subField: "Energy", ats: "workday", tenant: "cat", dc: "wd5", site: "SolarTurbines" },
  { company: "GE Appliances", short: "GEA", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "workday", tenant: "haier", dc: "wd3", site: "GE_Appliances" },
  { company: "Ellipsis Labs", short: "ELPS", logoClass: "tech", field: "Technology", subField: "Crypto", ats: "ashby", board: "ellipsislabs" },
  { company: "Tower Research Capital", short: "TWR", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "towerresearchcapital" },
  { company: "Virtu Financial", short: "VIRT", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "virtu" },
  { company: "Arrowstreet Capital", short: "ARWS", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "arrowstreetcapital", dc: "wd5", site: "Campus_Careers" },
  { company: "Walleye Capital", short: "WLLY", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "walleyecapital-external-students" },
  { company: "Aquatic Capital Management", short: "AQTC", logoClass: "fin", field: "Finance", subField: "Quant Trading", ats: "greenhouse", board: "aquaticcapitalmanagement" },
  { company: "Voloridge Investment Management", short: "VLRG", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "voloridgeinvestmentmanagement" },
  // Board tokens derived from real apply URLs (not guessed) and probed live.
  // Board is healthy but has no student-relevant req open today — kept anyway
  // so it activates the hour one posts, same as every other source here.
  { company: "LiveRamp", short: "RAMP", logoClass: "tech", field: "Technology", subField: "Data", ats: "workday", tenant: "liveramp", dc: "wd1", site: "LiveRampCareers" },
  // Kudu Dynamics postings actually run through Leidos's own Workday board
  // (Kudu is a Leidos subsidiary) — this source returns ALL Leidos reqs, not
  // just Kudu's, so it is labeled as the true employer rather than "Kudu
  // Dynamics". Labeling it Kudu would have misattributed every other Leidos
  // posting that comes through, which is the exact kind of misleading-name
  // issue a clean pipeline has to avoid.
  { company: "Leidos", short: "LDOS", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "workday", tenant: "leidos", dc: "wd5", site: "External" },
];


module.exports = { SOURCES };

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
  { company: "BNY Mellon", short: "BK", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "custom", handler: "bny" },
  { company: "Lazard", short: "LAZ", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "lazard", studentBoard: true },
  { company: "Evercore", short: "EVR", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "evercore", studentBoard: true },
  { company: "UBS", short: "UBS", logoClass: "fin", field: "Finance", subField: "Wealth Management", ats: "custom", handler: "ubs" },
  { company: "Edward Jones", short: "EJ", logoClass: "fin", field: "Finance", subField: "Wealth Management", ats: "custom", handler: "edwardjones" },
  { company: "Barclays", short: "BCS", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "barclays", dc: "wd3", site: "External_Career_Site_Barclays", positiveUsOnly: true },
  { company: "Mizuho", short: "MFG", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "mizuho", dc: "wd1", site: "mizuhoamericas", positiveUsOnly: true },
  { company: "MUFG", short: "MUFG", logoClass: "fin", field: "Finance", subField: "Corporate & Commercial Banking", ats: "workday", tenant: "mufgub", dc: "wd3", site: "MUFG-Careers", positiveUsOnly: true },
  { company: "AIG", short: "AIG", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "workday", tenant: "aig", dc: "wd1", site: "aig", positiveUsOnly: true },
  { company: "Travelers", short: "TRV", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "workday", tenant: "travelers", dc: "wd5", site: "External" },
  // Bulge-bracket / large banks — real ATS URLs found by search, then probed.
  { company: "Morgan Stanley", short: "MS", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "ms", dc: "wd5", site: "External" },
  { company: "Prudential Financial", short: "PRU", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "workday", tenant: "pru", dc: "wd5", site: "Careers" },
  { company: "Northwestern Mutual", short: "NM", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "workday", tenant: "northwesternmutual", dc: "wd5", site: "CORPORATE-CAREERS" },
  { company: "Capital Group", short: "CG", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "capgroup", dc: "wd1", site: "capitalgroupcareers" },
  { company: "MetLife", short: "MET", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "metlife" },
  { company: "Wells Fargo", short: "WFC", logoClass: "fin", field: "Finance", subField: "Corporate & Commercial Banking", ats: "workday", tenant: "wf", dc: "wd1", site: "WellsFargoJobs" },
  // Fidelity is on Workday's newer SHARED host (wd1.myworkdaysite.com), not the
  // per-tenant one, so without siteHost this pointed at a 404 and the card sat
  // empty. See fetchWorkday().
  { company: "Fidelity", short: "FID", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "fmr", dc: "wd1", site: "FidelityCareers", siteHost: true },
  // BofA's Workday tenant (ghr) is its LATERAL board - experienced hires only,
  // which is why this card never showed a student role. Campus recruiting lives
  // on tal.net (bankcampuscareers); read that instead.
  { company: "Bank of America", short: "BAC", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "bankofamerica", studentBoard: true },
  { company: "Jefferies", short: "JEF", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "jefferies" },
  { company: "Cantor Fitzgerald", short: "CF", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "cantorfitzgerald" },
  { company: "Chubb", short: "CB", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "chubb" },
  { company: "Sculptor Capital", short: "SCU", logoClass: "fin", field: "Finance", subField: "Hedge Fund", ats: "workday", tenant: "sculptor", dc: "wd12", site: "Sculptor_External_Career_Site" },
  { company: "MFS Investment Management", short: "MFS", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "mfs", dc: "wd1", site: "MFS-Careers" },
  { company: "Harris Williams", short: "HW", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "pnc", dc: "wd5", site: "HarrisWilliams" },
  { company: "Golub Capital", short: "GBDC", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "custom", handler: "golubcapital" },
  { company: "WEX", short: "WEX", logoClass: "fin", field: "Finance", subField: "Payments", ats: "custom", handler: "wex" },
  { company: "Synovus", short: "SNV", logoClass: "fin", field: "Finance", subField: "Banking", ats: "custom", handler: "synovus" },
  { company: "RBC", short: "RY", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "custom", handler: "rbc" },
  { company: "BMO", short: "BMO", logoClass: "fin", field: "Finance", subField: "Corporate & Commercial Banking", ats: "custom", handler: "bmo" },
  { company: "Wealthfront", short: "WF", logoClass: "fin", field: "Finance", subField: "Wealth Management", ats: "lever", board: "wealthfront" },
  { company: "Bill.com", short: "BILL", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "billcom" },
  { company: "Carta", short: "CRTA", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "carta" },
  { company: "Insight Partners", short: "IP", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "ashby", board: "insightpartners" },
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
  { company: "Battery Ventures", short: "BATT", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "batteryventures" },
  { company: "Level Equity", short: "LVEQ", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "levelequity" },
  { company: "Alpine Investors", short: "ALPI", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "alpineinvestors" },
  { company: "Thunes", short: "THNS", logoClass: "fin", field: "Finance", subField: "Payments", ats: "greenhouse", board: "thunes" },
  { company: "Nium", short: "NIUM", logoClass: "fin", field: "Finance", subField: "Payments", ats: "lever", board: "nium" },
  { company: "Highnote", short: "HNOT", logoClass: "fin", field: "Finance", subField: "Payments", ats: "greenhouse", board: "highnote" },
  { company: "Beyond Finance", short: "BYND", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "beyondfinance" },
  { company: "Pagaya", short: "PGY", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "pagaya" },
  { company: "Lithic", short: "LTHC", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "lithic" },
  { company: "Happy Money", short: "HPMY", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "happymoney" },
  { company: "Treasury Prime", short: "TPRM", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "treasuryprime" },
  { company: "Modern Treasury", short: "MTRS", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "moderntreasury" },
  { company: "Acorns", short: "ACRN", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "acorns" },
  { company: "Frec", short: "FREC", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "frec" },
  { company: "Unit", short: "UNIT", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "unit" },
  { company: "Column", short: "COLM", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "ashby", board: "column" },
  { company: "Callan", short: "CLLN", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "lever", board: "callan" },
  { company: "Artisan Partners", short: "APAM", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "greenhouse", board: "artisanpartners" },

  // ═══ ADDED Sep 2026 (trey/finance-ats-feeds): watchlist → real ATS ════════
  // Each discovered by reading the ATS off the live careers page (not guessed)
  // and probed before adding. Ownership confirmed: Greenhouse board name,
  // Ashby/Lever page <title>, or Workday tenant on the employer's own domain.
  // Names match watchlist.js exactly so the placeholder card flips on flip.
  // Payments
  { company: "PayPal", short: "PYPL", logoClass: "fin", field: "Finance", subField: "Payments", ats: "workday", tenant: "paypal", dc: "wd1", site: "jobs" },
  { company: "Green Dot", short: "GDOT", logoClass: "fin", field: "Finance", subField: "Payments", ats: "workday", tenant: "greendotcorp", dc: "wd1", site: "gdc" },
  { company: "Marqeta", short: "MQ", logoClass: "fin", field: "Finance", subField: "Payments", ats: "ashby", board: "marqeta-inc" },
  // Fintech / financial software (Bread Financial already added on main)
  { company: "nCino", short: "NCNO", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "ncinoinc" },
  { company: "OppFi", short: "OPFI", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "opploans" },
  { company: "Morningstar", short: "MORN", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "morningstar", dc: "wd5", site: "morningstar" },
  { company: "FactSet", short: "FDS", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "factset", dc: "wd108", site: "FactSetCareers" },
  { company: "SS&C Technologies", short: "SSNC", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "ssctech", dc: "wd1", site: "SSCTechnologies" },
  { company: "Kyriba", short: "KYRB", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "workday", tenant: "kyriba", dc: "wd5", site: "Kyriba-Careers" },
  // Private equity
  { company: "Thoma Bravo", short: "TB", logoClass: "fin", field: "Finance", subField: "Private Equity", ats: "lever", board: "thomabravo" },

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
  { company: "Woolpert", short: "WLP", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "greenhouse", board: "woolpert" },
  { company: "DLR Group", short: "DLR", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "greenhouse", board: "dlrgroup" },
  { company: "Barnes & Thornburg", short: "BT", logoClass: "law", field: "Law", subField: "Big Law", ats: "ashby", board: "barnes" },
  { company: "Turing", short: "TRNG", logoClass: "tech", field: "Technology", subField: "Software Engineering", ats: "greenhouse", board: "turing" },
  { company: "Toptal", short: "TPTL", logoClass: "tech", field: "Technology", subField: "Software Engineering", ats: "lever", board: "toptal" },
  { company: "Andela", short: "ANDL", logoClass: "tech", field: "Technology", subField: "Software Engineering", ats: "ashby", board: "andela" },
  { company: "Sayari", short: "SAY", logoClass: "tech", field: "Technology", subField: "Data", ats: "greenhouse", board: "sayari" },
  { company: "Elliptic", short: "ELPT", logoClass: "tech", field: "Technology", subField: "Data", ats: "ashby", board: "elliptic" },
  { company: "Teague", short: "TEAG", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "greenhouse", board: "teague" },
  { company: "Applied Intuition", short: "APIN", logoClass: "eng", field: "Engineering", subField: "Robotics", ats: "ashby", board: "applied" },
  { company: "Pacific Fusion", short: "PFUS", logoClass: "eng", field: "Engineering", subField: "Energy", ats: "greenhouse", board: "pacificfusion" },
  { company: "Xcimer Energy", short: "XCMR", logoClass: "eng", field: "Engineering", subField: "Energy", ats: "lever", board: "xcimer" },
  { company: "Radiant", short: "RDNT", logoClass: "eng", field: "Engineering", subField: "Energy", ats: "ashby", board: "radiant" },
  { company: "Astra", short: "ASTR", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "ashby", board: "astra" },
  { company: "Impulse Labs", short: "IMPL", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "ashby", board: "impulse" },
  { company: "Fehr & Peers", short: "FP2", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "lever", board: "fehrandpeers" },
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
  { company: "Veeva Systems", short: "VEEV", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "lever", board: "veeva" },
  { company: "Truveta", short: "TRV2", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "truveta" },
  { company: "HealthVerity", short: "HV", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "healthverity" },
  { company: "Verana Health", short: "VRNA", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "veranahealth" },
  { company: "Science 37", short: "SCI37", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "science37" },
  { company: "Care Access", short: "CARE", logoClass: "health", field: "Healthcare", subField: "Health Systems", ats: "greenhouse", board: "careaccess" },
  { company: "Owkin", short: "OWK", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "ashby", board: "owkin" },
  { company: "Unlearn.AI", short: "ULRN", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "ashby", board: "unlearn" },
  { company: "Lightship", short: "LSHP", logoClass: "health", field: "Healthcare", subField: "Health Systems", ats: "lever", board: "lightship" },
  { company: "Sword Health", short: "SWRD", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "swordhealth" },
  { company: "Freenome", short: "FRNM", logoClass: "health", field: "Healthcare", subField: "Biotech", ats: "greenhouse", board: "freenome" },
  { company: "Talkspace", short: "TALK", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "talkspace" },
  { company: "Aledade", short: "ALDE", logoClass: "health", field: "Healthcare", subField: "Health Systems", ats: "lever", board: "aledade" },
  { company: "Everlywell", short: "EVWL", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "lever", board: "everlywell" },
  { company: "Cedar", short: "CEDR", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "ashby", board: "cedar" },
  { company: "Avalere Health", short: "AVLR", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "lever", board: "avalerehealth" },
  { company: "Precision AQ", short: "PAQ", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "precisionaq" },
  { company: "Premier Inc", short: "PINC", logoClass: "health", field: "Healthcare", subField: "Health Systems", ats: "workday", tenant: "premierinc", dc: "wd1", site: "External_Professional" },
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
  { company: "Coca-Cola", short: "KO", logoClass: "consumer", field: "Consumer", subField: "Beverages", ats: "custom", handler: "cocacola" },
  { company: "Cleveland Clinic", short: "CC", logoClass: "health", field: "Healthcare", subField: "Hospital Systems", ats: "custom", handler: "clevelandclinic" },
  { company: "Glossier", short: "GLOS", logoClass: "consumer", field: "Consumer", subField: "Beauty", ats: "greenhouse", board: "glossier" },
  { company: "Coursera", short: "COUR", logoClass: "edu", field: "Education", subField: "Education Technology", ats: "greenhouse", board: "coursera" },
  { company: "The Athletic", short: "ATH", logoClass: "media", field: "Sports", subField: "Sports Media", ats: "lever", board: "theathletic" },
  { company: "Berkadia", short: "BRKD", logoClass: "consumer", field: "Real Estate", subField: "Commercial Real Estate", ats: "greenhouse", board: "berkadia" },
  { company: "VTS", short: "VTS", logoClass: "consumer", field: "Real Estate", subField: "Property Technology", ats: "greenhouse", board: "vts" },

  // ═══ ADDED Sep 2026 (trey/eng-sports-jackhenry): watchlist → real ATS ═════
  // ATS read off the live careers page and probed; ownership confirmed via
  // Greenhouse board name / Phenom host on the employer's own domain.
  { company: "RTX (Raytheon)", short: "RTX", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "custom", handler: "rtx" },
  { company: "NFL", short: "NFL", logoClass: "media", field: "Sports", subField: "Teams & Leagues", ats: "greenhouse", board: "nflcareers" },
  { company: "Fanatics", short: "FAN", logoClass: "consumer", field: "Sports", subField: "Sports Technology", ats: "greenhouse", board: "fanaticsinc" },

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

  // ── Consulting, added 9 Sep 2026 ──────────────────────────────────────
  // Consulting had 8 sources against Finance's 146, while being the second most
  // common field students actually use Promptly for. Every board below was
  // verified against its own stated name or a live 200 before landing here —
  // see docs/SOURCE-HUNTING-FINDINGS.md for the ones that failed that test.
  // MBB. Not on any standard system — the job list is JavaScript-rendered, so
  // discover-ats.js finds nothing. The gateway endpoint was found by watching
  // the rendered page's own network calls. See company-scrapers/mckinsey.js.
  { company: "McKinsey & Company", short: "MCK", logoClass: "consult", field: "Consulting", subField: "Strategy", ats: "custom", handler: "mckinsey" },
  { company: "AlixPartners", short: "AXP", logoClass: "consult", field: "Consulting", subField: "Restructuring", ats: "greenhouse", board: "alixpartners" },
  // Greenhouse board is literally named "West Monroe (Campus)" — a dedicated
  // student board, which is the best possible shape for this product.
  // Consulting — Workday tenants read off each firm's live careers page.
  // Global firms carry positiveUsOnly: their boards return every country and an
  // unfamiliar foreign office otherwise reads as US.
  // Accenture was held back because its Workday board returns locationsText
  // undefined on every req, so a US role could not be told from an India one.
  // Resolved 15 Sep 2026 with workdayFacets: the board's own Country facet is
  // applied server-side, so every req it returns is US by construction. See the
  // Accenture row in the round-three block below.
  { company: "Grant Thornton", short: "GT", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "grantthornton" },
  { company: "BDO", short: "BDO", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "bdo" },
  { company: "BCG", short: "BCG", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "bcg" },
  { company: "L.E.K. Consulting", short: "LEK", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "lek" },
  { company: "ClearView Healthcare Partners", short: "CVHP", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "clearviewhealthcarepartners" },
  { company: "Frazier & Deeter", short: "FD", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "frazierdeeter" },
  { company: "Forvis Mazars", short: "FORV", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "forvismazars" },
  { company: "OLIVER Agency", short: "OLV", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "oliver" },
  { company: "VML", short: "VML", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "wundermanthompson" },
  { company: "Zeta Global", short: "ZETA", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "zetaglobal" },
  { company: "Code and Theory", short: "CAT", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "codeandtheory" },
  { company: "Critical Mass", short: "CM", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "criticalmass" },
  { company: "GREY", short: "GREY", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "grey" },
  { company: "Barbarian", short: "BARB", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "barbarian" },
  { company: "Instrument", short: "INST", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "lever", board: "instrument" },
  { company: "Anomaly", short: "ANOM", logoClass: "media", field: "Marketing", subField: "Brand", ats: "lever", board: "anomaly" },
  { company: "Viget", short: "VGT", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "lever", board: "viget" },
  { company: "Weber Shandwick", short: "WS", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "webershandwick" },
  { company: "FleishmanHillard", short: "FH", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "fleishmanhillard" },
  { company: "Golin", short: "GOLN", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "golin" },
  { company: "Method Communications", short: "MCOM", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "methodcommunications" },
  { company: "Mission North", short: "MN", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "missionnorth" },
  { company: "Current Global", short: "CG2", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "currentglobal" },
  { company: "Brainlabs", short: "BRNL", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "brainlabs" },
  { company: "WebFX", short: "WFX", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "ashby", board: "webfx" },
  { company: "Seer Interactive", short: "SEER", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "lever", board: "seerinteractive" },
  { company: "LaunchSquad", short: "LSQ", logoClass: "media", field: "Marketing", subField: "Brand", ats: "lever", board: "launchsquad" },
  { company: "Jellyfish", short: "JLY", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "ashby", board: "jellyfish" },
  { company: "Zeno Group", short: "ZENO", logoClass: "media", field: "Marketing", subField: "Brand", ats: "ashby", board: "zeno" },
  { company: "Fingerpaint Group", short: "FP", logoClass: "media", field: "Marketing", subField: "Brand", ats: "ashby", board: "fingerpaint" },
  { company: "Reprise", short: "RPRS", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "ashby", board: "reprise" },
  { company: "FGS Global", short: "FGS", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "fgsglobal" },
  { company: "Purple Strategies", short: "PRPL", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "purplestrategies" },
  { company: "GMMB", short: "GMMB", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "gmmb" },
  { company: "Landor", short: "LND", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "landor" },
  { company: "Interbrand", short: "IB", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "interbrand" },
  { company: "Prophet", short: "PRPH", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "prophet" },
  { company: "Definitive Healthcare", short: "DH", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "greenhouse", board: "definitivehc" },
  { company: "Huge", short: "HUGE", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "hugeinc" },
  { company: "AKQA", short: "AKQA", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "akqa" },
  { company: "Trace3", short: "TR3", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "greenhouse", board: "trace3" },
  { company: "FSG", short: "FSG", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "fsg" },
  // Expert networks: consulting-adjacent research firms that hire analysts out
  // of undergrad in volume.
  { company: "Guidepoint", short: "GP", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "guidepoint" },
  { company: "Third Bridge", short: "TB3", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "thirdbridge" },
  { company: "AlphaSights", short: "AS", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "alphasights" },
  { company: "Accordion", short: "ACRD", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "accordion" },
  { company: "Pariveda", short: "PVD", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "ashby", board: "pariveda" },
  { company: "Bounteous", short: "BNTS", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "lever", board: "bounteous" },
  { company: "Morning Consult", short: "MC", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "ashby", board: "morningconsult" },
  { company: "HCVT", short: "HCVT", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "lever", board: "hcvt" },
  { company: "Perr&Knight", short: "PK", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "lever", board: "perrknight" },
  { company: "Vaco", short: "VACO", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "vaco" },
  { company: "Grassi", short: "GRSI", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "grassi" },
  { company: "Schneider Downs", short: "SD", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "schneiderdowns" },
  { company: "Kreischer Miller", short: "KM", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "kreischermiller" },
  { company: "Mintel", short: "MNTL", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "mintel" },
  { company: "Marakon", short: "MRKN", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "marakon" },
  { company: "Catalant", short: "CTL", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ashby", board: "catalant" },
  { company: "Graphite", short: "GRPH", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ashby", board: "graphite" },
  // Was lever:oliverwyman — its page title is "Oliver Wyman Labs" and it holds
  // two non-student SF tech roles. The consultancy itself hires on Marsh
  // McLennan's shared board; see api/_shared/mmc.js for how reqs are routed.
  { company: "Oliver Wyman", short: "OW", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "oliverwyman" },
  { company: "IDEO", short: "IDEO", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "ideo" },
  { company: "Cheiron", short: "CHRN", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ashby", board: "cheiron" },
  { company: "Capco", short: "CPCO", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "greenhouse", board: "capco" },
  { company: "Baringa", short: "BRGA", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "baringa" },
  { company: "Gallup", short: "GLP", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "gallup" },
  { company: "BearingPoint", short: "BRPT", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "greenhouse", board: "bearingpoint" },
  { company: "Teneo", short: "TNEO", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "teneo" },
  { company: "Brunswick Group", short: "BRNS", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "brunswickgroup" },
  { company: "Elixirr", short: "ELXR", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "elixirr" },
  { company: "Centri Business Consulting", short: "CNTR", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "centribusinessconsulting" },
  { company: "LogicSource", short: "LGSC", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "logicsource" },
  { company: "DeciBio", short: "DCBO", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "decibio" },
  { company: "Freed Associates", short: "FREE", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "freedassociates" },
  { company: "Cairneagle", short: "CRNE", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "cairneagle" },
  { company: "The Berkeley Partnership", short: "TBP", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "theberkeleypartnership" },
  { company: "CFGI", short: "CFGI", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "lever", board: "cfgi" },
  { company: "Cprime", short: "CPRM", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "lever", board: "cprime" },
  { company: "SYPartners", short: "SYP", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "lever", board: "sypartners" },
  { company: "The Chartis Group", short: "CHRT", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ashby", board: "chartis" },
  { company: "Proxima", short: "PRXM", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ashby", board: "proxima" },
  { company: "Ankura", short: "ANKR", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "ankura", dc: "wd5", site: "Ankura" },
  { company: "Stout", short: "STOU", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "stout", dc: "wd5", site: "Stout-Student-Careers", studentBoard: true },
  { company: "Heidrick & Struggles", short: "HSII", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "heidrick", dc: "wd1", site: "heidrickandstruggles" },
  { company: "ICF", short: "ICFI", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "icf" },
  { company: "The Brattle Group", short: "BRAT", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "thebrattlegroup" },
  { company: "Protiviti", short: "PRO", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "roberthalf", dc: "wd1", site: "ProtivitiNA" },
  { company: "RSM", short: "RSM", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "rsm", dc: "wd1", site: "RSMCareers" },
  { company: "Genpact", short: "G", logoClass: "cons", field: "Consulting", subField: "Technology Consulting", ats: "workday", tenant: "genpact", dc: "wd108", site: "External_Careers", positiveUsOnly: true },
  { company: "West Monroe", short: "WM", logoClass: "consult", field: "Consulting", subField: "Tech Consulting", ats: "greenhouse", board: "westmonroe5" },
  { company: "Cornerstone Research", short: "CRES", logoClass: "consult", field: "Consulting", subField: "Economic Consulting", ats: "workday", tenant: "cornerstone", dc: "wd501", site: "CornerstoneResearch_Careers" },
  { company: "Baker Tilly", short: "BT", logoClass: "consult", field: "Consulting", subField: "Accounting & Advisory", ats: "workday", tenant: "bakertilly", dc: "wd5", site: "BTCareers" },
  { company: "Forrester", short: "FORR", logoClass: "consult", field: "Consulting", subField: "Research & Advisory", ats: "workday", tenant: "forrester", dc: "wd501", site: "careers" },
  { company: "Riveron", short: "RIV", logoClass: "consult", field: "Consulting", subField: "Restructuring", ats: "ashby", board: "riveron" },
  { company: "Point B", short: "PTB", logoClass: "consult", field: "Consulting", subField: "Strategy", ats: "lever", board: "pointb" },
  { company: "Propeller Consulting", short: "PROP", logoClass: "consult", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "propellerconsulting" },

  // ── Trey's 500-firm list, round three (15 Sep 2026) ──────────────────
  // Earlier rounds guessed Greenhouse/Lever/Ashby tokens; these were found by
  // reading each firm's OWN careers page for the ATS it links to, then probing
  // it through the production fetcher. Ownership evidence per row: Greenhouse
  // board name, Lever/Ashby page title, SmartRecruiters company name, or a
  // Workday site linked from the employer's own domain.
  // Workday's USA country id is global across tenants, not per-board.
  // Accenture: board returns no locationsText, so the Country facet is what
  // proves a req is US (see workdayFacets in aggregator.js). The city shown on
  // a card comes from the posting path and is display-only.
  { company: "Accenture", short: "ACN", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "workday", tenant: "accenture", dc: "wd103", site: "AccentureCareers", workdayFacets: { locationCountry: ["bc33aa3152ec42d4995f4791a106ed09"] } },
  // A separate US-only legal entity with its own board ("Accenture Federal Services").
  { company: "Accenture Federal Services", short: "AFS", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "greenhouse", board: "accenturefederalservices" },
  { company: "Berkeley Research Group", short: "BRG", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "workday", tenant: "thinkbrg", dc: "wd5", site: "BRG_External_Career_Site" },
  // Compass Lexecon is FTI-owned and sits on FTI's tenant under its own site.
  { company: "Compass Lexecon", short: "CL", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "workday", tenant: "fticonsulting", dc: "wd108", site: "CompassLexeconCareers", positiveUsOnly: true },
  // Board name "Secretariat". One req per office, one of which is literally
  // "International" — positiveUsOnly keeps only the US offices.
  { company: "Secretariat", short: "SEC2", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "greenhouse", board: "secretariatadvisorsllc", positiveUsOnly: true },
  { company: "Energy and Environmental Economics (E3)", short: "E3", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "lever", board: "ethree" },
  { company: "Econic Partners", short: "ECON", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "workday", tenant: "econicpartners", dc: "wd501", site: "econicpartnerscareers" },
  { company: "Altman Solon", short: "ALTS", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "altmansolonuslp" },
  // Two boards, one per US office — see company-scrapers/marsandco.js.
  { company: "Mars & Co", short: "MARS", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "marsandco" },
  // kxadvisors.com/careers links this board; its legal name is "BGBx Consulting".
  { company: "Kx Advisors", short: "KX", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "bgbxconsulting" },
  { company: "Trinity Life Sciences", short: "TRIN", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "workday", tenant: "trinitylifesciences", dc: "wd108", site: "Trinity" },
  { company: "ghSMART", short: "GHS", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "lever", board: "ghsmartjobs" },
  { company: "Kotter", short: "KOTR", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "kotterinternational" },
  { company: "Capstone DC", short: "CAPS", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "workday", tenant: "capstonedc", dc: "wd501", site: "Capstone" },
  // Putnam Associates is part of Inizio; careers.putassoc.com links straight to
  // this board, which is named "Inizio" and is mostly Gurugram — hence the gate.
  { company: "Inizio", short: "INZ", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "greenhouse", board: "inizio", positiveUsOnly: true },
  { company: "Valtech", short: "VALT", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "greenhouse", board: "valtech" },
  { company: "Nordic Consulting", short: "NORD", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "workday", tenant: "nordic", dc: "wd1", site: "Nordic" },
  { company: "General Dynamics Information Technology", short: "GDIT", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "workday", tenant: "gdit", dc: "wd5", site: "External_Career_Site" },
  { company: "Public Consulting Group", short: "PCG", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "pcg", dc: "wd1", site: "PCG_External_Careers" },
  { company: "ERM", short: "ERM", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "erm", dc: "wd3", site: "ERM_Careers", positiveUsOnly: true },
  { company: "Connor Group", short: "CONG", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "connorgp", dc: "wd12", site: "CG" },
  // MorganFranklin now operates as Highspring; morganfranklin.com points there.
  { company: "Highspring (MorganFranklin)", short: "HSPR", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "greenhouse", board: "morganfranklinconsultingllc" },
  { company: "Bridgepoint Consulting", short: "BPC", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ashby", board: "bridgepoint-consulting" },
  { company: "Customized Energy Solutions", short: "CES", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "smartrecruiters", board: "CustomizedEnergySolutions" },
  { company: "Sia Partners", short: "SIA", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "smartrecruiters", board: "Sia" },
  // Aspirant was acquired by Wavestone; aspirant.com's careers link lands here.
  { company: "Wavestone (Aspirant)", short: "WAVE", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "smartrecruiters", board: "Wavestone1" },
  // Chemonics' board is linked from chemonics.com and currently holds 0 reqs.
  { company: "Chemonics", short: "CHEM", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "chemonics", dc: "wd108", site: "chemonics_careers", siteHost: true },
  { company: "Wood Mackenzie", short: "WOOD", logoClass: "cons", field: "Consulting", subField: "Research & Advisory", ats: "workday", tenant: "woodmac", dc: "wd3", site: "woodmaccareers", positiveUsOnly: true },
  { company: "S&P Global", short: "SPGI", logoClass: "fin", field: "Finance", subField: "Research & Advisory", ats: "workday", tenant: "spgi", dc: "wd5", site: "SPGI_Careers", positiveUsOnly: true },
  { company: "Cambridge Associates", short: "CA", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "workday", tenant: "cambridgeassociates", dc: "wd5", site: "Cambridge_Associates", positiveUsOnly: true },
  { company: "Wilshire Advisors", short: "WILS", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "smartrecruiters", board: "WilshireAdvisorsLLC" },
  { company: "EPIC Insurance Brokers", short: "EPIC", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "greenhouse", board: "edgewoodpartnersinsurancecenter" },
  { company: "IQVIA", short: "IQV", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "workday", tenant: "iqvia", dc: "wd1", site: "IQVIA", positiveUsOnly: true },
  { company: "Syneos Health", short: "SYNH", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "workday", tenant: "syneoshealth", dc: "wd12", site: "Syneos_Health_External_Site", positiveUsOnly: true },
  { company: "Cencora", short: "COR", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "workday", tenant: "myhrabc", dc: "wd5", site: "Global", positiveUsOnly: true },
  { company: "Press Ganey", short: "PGA", logoClass: "health", field: "Healthcare", subField: "Health Technology", ats: "workday", tenant: "pressganey", dc: "wd1", site: "Careers" },
  { company: "HNTB", short: "HNTB", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "workday", tenant: "hntb", dc: "wd5", site: "HNTB_Careers" },
  // TYLin hires on its parent Global Infrastructure Solutions' tenant, which is
  // ~40% Spain/Canada/Brazil and writes locations as "US | IL | Chicago - …"
  // with no country word, so the Country facet does the US filtering.
  { company: "TYLin", short: "TYL", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "workday", tenant: "gi", dc: "wd1", site: "Global_Infrastructure", workdayFacets: { locationCountry: ["bc33aa3152ec42d4995f4791a106ed09"] } },
  { company: "Ramboll", short: "RAMB", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "smartrecruiters", board: "Ramboll3" },
  { company: "Edelman", short: "EDEL", logoClass: "media", field: "Marketing", subField: "Brand", ats: "workday", tenant: "djeholdings", dc: "wd5", site: "edelman-careers-E200", positiveUsOnly: true },
  { company: "Penta Group", short: "PNTA", logoClass: "media", field: "Marketing", subField: "Brand", ats: "lever", board: "pentagrp" },
  { company: "Blue State", short: "BLST", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "greenhouse", board: "bluestatedigital" },
  // Marsh McLennan's businesses share one Workday board whose list reply names
  // none of them. api/_shared/mmc.js reads it once per refresh and routes each
  // req by the legal entity on its detail record, so a Mercer internship can
  // never be filed under Marsh. Oliver Wyman (above) reads the same feed.
  { company: "Mercer", short: "MRCR", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "mercer" },
  { company: "NERA Economic Consulting", short: "NERA", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "custom", handler: "nera" },
  { company: "Marsh McLennan Agency", short: "MMA", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "marshmclennanagency" },
  { company: "Marsh", short: "MRSH", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "marsh" },
  { company: "Guy Carpenter", short: "GC", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "guycarpenter" },
  // Phenom sites whose search page does not server-render results; both read
  // the /widgets feed the page itself calls.
  { company: "Crowe", short: "CRWE", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "crowe" },
  { company: "MITRE", short: "MITR", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "mitre" },
  // Jibe front-ends (iCIMS underneath) and Phenom sites, each on the
  // employer's own careers domain. One file per employer in company-scrapers/.
  { company: "ZS Associates", short: "ZS", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "zs" },
  { company: "ECG Management Consultants", short: "ECG", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "ecgmc" },
  { company: "Noblis", short: "NBLS", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "noblis" },
  { company: "NTT DATA", short: "NTTD", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "nttdata" },
  // Publicis Groupe runs one Jibe site for every agency; tags2 carries the
  // brand, so each card keeps only its own reqs.
  { company: "Publicis Sapient", short: "PSAP", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "publicissapient" },
  { company: "Epsilon", short: "EPSL", logoClass: "media", field: "Marketing", subField: "Digital Media", ats: "custom", handler: "epsilon" },
  { company: "Aon", short: "AON", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "aon" },
  { company: "Gallagher", short: "AJG", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "gallagher" },
  { company: "HUB International", short: "HUB", logoClass: "fin", field: "Finance", subField: "Insurance", ats: "custom", handler: "hubinternational" },
  { company: "CDM Smith", short: "CDM", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "cdmsmith" },
  { company: "Gannett Fleming TranSystems", short: "GFT", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "gftinc" },
  { company: "TRC Companies", short: "TRC", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "trccompanies" },
  { company: "Quest Global", short: "QST", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "custom", handler: "questglobal" },
  { company: "Clarivate", short: "CLVT", logoClass: "tech", field: "Technology", subField: "Data", ats: "custom", handler: "clarivate" },
  // Taleo's newer REST job board (portal id read off each employer's own links;
  // see api/_shared/taleo.js). HDR was recorded as unreadable before this.
  { company: "HDR", short: "HDR", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "hdr" },
  { company: "Segal", short: "SGL", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "segal" },
  // Oracle Recruiting Cloud tenants, each linked from the employer's careers page.
  { company: "Michael Baker International", short: "MBI", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "michaelbaker" },
  { company: "DNV", short: "DNV", logoClass: "eng", field: "Engineering", subField: "Energy", ats: "custom", handler: "dnv" },
  { company: "The Hackett Group", short: "HCKT", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "hackett" },
  { company: "Abt Global", short: "ABT", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "abtglobal" },
  { company: "EXL", short: "EXLS", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "exl" },
  { company: "Hexaware Technologies", short: "HEXA", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "hexaware" },
  // Vizient (Kaufman Hall and Sg2 are Vizient businesses) — Eightfold.
  { company: "Vizient", short: "VZT", logoClass: "health", field: "Healthcare", subField: "Health Systems", ats: "custom", handler: "vizient" },
  { company: "ManTech", short: "MANT", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "mantech" },
  // SAP SuccessFactors. Wipro, HCLTech and OPEN Health are on the newer Career
  // Site Builder, read through its JSON route (api/_shared/sf-careers.js); the
  // rest are the older server-rendered template (jobs2web.js).
  { company: "Wipro", short: "WIT", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "wipro" },
  { company: "HCLTech", short: "HCL", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "hcltech" },
  { company: "LTIMindtree", short: "LTIM", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "ltimindtree" },
  { company: "Birlasoft", short: "BSFT", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "birlasoft" },
  { company: "OPEN Health", short: "OPEN", logoClass: "health", field: "Healthcare", subField: "Pharma", ats: "custom", handler: "openhealth" },
  { company: "Black & Veatch", short: "BV", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "blackveatch" },
  { company: "AVL", short: "AVL", logoClass: "eng", field: "Engineering", subField: "Automotive", ats: "custom", handler: "avl" },
  // iCIMS portals read directly (api/_shared/icims.js). This is the iCIMS
  // adapter from the priority list; Peraton, Kimley-Horn and Dewberry were
  // recorded as blocked on it.
  { company: "Peraton", short: "PERA", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "peraton" },
  { company: "LMI", short: "LMI", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "lmi" },
  { company: "RTI International", short: "RTI", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "custom", handler: "rti" },
  { company: "Analysis Group", short: "AG", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "custom", handler: "analysisgroup" },
  { company: "BerryDunn", short: "BDNN", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "berrydunn" },
  { company: "Health Management Associates", short: "HMA", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "healthmanagement" },
  { company: "Wakely Consulting Group", short: "WAKE", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "wakely" },
  { company: "Lumanity", short: "LUMA", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "lumanity" },
  { company: "IDC", short: "IDC", logoClass: "cons", field: "Consulting", subField: "Research & Advisory", ats: "custom", handler: "idc" },
  { company: "Kimley-Horn", short: "KH", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "kimleyhorn" },
  { company: "Dewberry", short: "DEW", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "dewberry" },
  { company: "Geosyntec Consultants", short: "GEO", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "geosyntec" },
  // Small public-feed ATSs (api/_shared/small-ats.js). Each board id was read
  // off the employer's own careers page; US-ness comes from the feed's own
  // country field, so the global firms here (Control Risks, dss+, HKA,
  // Anthesis) contribute only their US offices.
  { company: "Rystad Energy", short: "RYS", logoClass: "cons", field: "Consulting", subField: "Research & Advisory", ats: "workable", board: "rystad-energy" },
  { company: "3Degrees", short: "3DEG", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workable", board: "3degrees" },
  { company: "Clarkston Consulting", short: "CLRK", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workable", board: "clarkston-consulting" },
  { company: "Board of Innovation", short: "BOI", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "workable", board: "boardofinnovation" },
  { company: "Control Risks", short: "CR", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workable", board: "control-risks-6" },
  { company: "Corcentric", short: "CORC", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workable", board: "corcentric" },
  { company: "Rational 360", short: "R360", logoClass: "media", field: "Marketing", subField: "Brand", ats: "workable", board: "rational" },
  { company: "ScottMadden", short: "SMAD", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ukg", board: "recruiting.ultipro.com/SCO1003/22ca7f41-78f3-cde2-bcd8-ff0e272a1bd9" },
  { company: "Milliman", short: "MILL", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "ukg", board: "recruiting2.ultipro.com/MIL1017/f54234e9-dfde-b183-fd20-4fbdb19cba7a" },
  { company: "Dentons Global Advisors", short: "DGA", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "ukg", board: "dgahr.rec.pro.ukg.net/DEN1502DGBV/35d54f2b-b9c1-442f-9403-035c369c012b" },
  // Procurement Leaders is a World 50 business; procurementleaders.com links here.
  { company: "World 50 (Procurement Leaders)", short: "W50", logoClass: "cons", field: "Consulting", subField: "Research & Advisory", ats: "ukg", board: "recruiting.ultipro.com/WOR1028WORLD/d2b84cd1-d0d3-460f-93cf-92a3b91f0a10" },
  { company: "NEPC", short: "NEPC", logoClass: "fin", field: "Finance", subField: "Asset Management", ats: "ukg", board: "recruiting.ultipro.com/NEP1001NEPC/9b5186b6-746b-4df0-8522-90c2a5fcfa17" },
  { company: "MarshBerry", short: "MBRY", logoClass: "fin", field: "Finance", subField: "Investment Banking", ats: "ukg", board: "recruiting.ultipro.com/MAR1036MBCI/0127d5ea-e4e8-48ee-a74a-cc71dcd13133" },
  { company: "StoneTurn", short: "STRN", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "adp", board: "8f429b49-bae5-4749-b26e-36df29852d8d" },
  { company: "Curinos", short: "CURI", logoClass: "cons", field: "Consulting", subField: "Research & Advisory", ats: "adp", board: "4d6d36b1-bedf-4c57-88e7-3817e50bbf21" },
  // DAI's board is almost entirely overseas project posts; US roles are few.
  { company: "DAI Global", short: "DAI", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "adp", board: "5745ed7b-7f8d-47a9-9161-d975aa7f3314" },
  // Board title: "Development Dimensions International Inc".
  { company: "DDI", short: "DDI", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "paylocity", board: "0ff3194a-0939-4c12-a4cc-729b385d05e7" },
  { company: "Edgeworth Economics", short: "EDGE", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "paylocity", board: "84ca0b5b-570a-409a-8e91-242f0baca23d" },
  // Board title: "FEV North America Inc".
  { company: "FEV", short: "FEV", logoClass: "eng", field: "Engineering", subField: "Automotive", ats: "paylocity", board: "c4680135-a10e-4943-b198-09ecfe4c72ad" },
  { company: "Anthesis Group", short: "ANTH", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "pinpoint", board: "anthesisgroup" },
  { company: "dss+", short: "DSS", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "recruitee", board: "consultdss" },
  { company: "Cambridge Systematics", short: "CSYS", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "jobvite", board: "camsyscareers" },
  // RoseRyan is now part of ZRG Partners; roseryan.com links to this board.
  { company: "ZRG Partners", short: "ZRG", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "rippling", board: "zrg-partners-careers" },
  { company: "HKA", short: "HKA", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "teamtailor", board: "hka.teamtailor.com" },
  { company: "Precision Strategies", short: "PRCS", logoClass: "media", field: "Marketing", subField: "Brand", ats: "breezy", board: "precision-strategies" },
  { company: "Siegel+Gale", short: "S+G", logoClass: "media", field: "Marketing", subField: "Brand", ats: "breezy", board: "siegel-gale" },
  { company: "TiER1 Performance", short: "TIER", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "breezy", board: "tier1-performance" },
  { company: "Proudfoot", short: "PRDF", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "bamboohr", board: "proudfoot" },
  { company: "Blue Matter", short: "BLUM", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "jazzhr", board: "bluematterconsulting" },
  // kaiserassociates.com/roles-and-open-positions links this board.
  { company: "Kaiser Associates", short: "KAIS", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "jazzhr", board: "kaiserassociates" },
  { company: "Culture Partners", short: "CULT", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "jazzhr", board: "culturepartners" },
  // WTW — its own careers site server-renders results; see company-scrapers/wtw.js.
  { company: "WTW", short: "WTW", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "wtw" },
  // Workday tenants found by the datacenter/site probe (a wrong dc answers
  // 422, the right dc with a wrong site 404, the right site 200), then checked
  // against the reqs themselves. Gartner's jobs.gartner.com sits behind a
  // Cloudflare challenge; its Workday board does not, same as J&J above.
  { company: "Gartner", short: "IT", logoClass: "cons", field: "Consulting", subField: "Research & Advisory", ats: "workday", tenant: "gartner", dc: "wd5", site: "EXT", positiveUsOnly: true },
  // Parsons, like Accenture, returns no locationsText; the Country facet filters.
  { company: "Parsons", short: "PSN", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "workday", tenant: "parsons", dc: "wd5", site: "Search", workdayFacets: { locationCountry: ["bc33aa3152ec42d4995f4791a106ed09"] } },
  // CACI's own apply links (e.g. its Summer 2027 intern reqs) go to this site.
  { company: "CACI", short: "CACI", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "workday", tenant: "caci", dc: "wd1", site: "external", positiveUsOnly: true },
  // Manatt Health is a practice of the law firm; manatt.com lists these reqs.
  { company: "Manatt, Phelps & Phillips", short: "MANT2", logoClass: "law", field: "Law", subField: "Big Law", ats: "greenhouse", board: "manattphelpsphillips" },
  // Amentum hires on the Workday tenant it inherited from PAE; locations are
  // coded ("US-TX-Houston") — see company-scrapers/amentum.js.
  { company: "Amentum", short: "AMTM", logoClass: "eng", field: "Engineering", subField: "Aerospace & Defense", ats: "custom", handler: "amentum" },
  // Kalypso is a Rockwell Automation company; its own Workday site refuses
  // public reads (403), and its reqs appear on Rockwell's main site.
  { company: "Rockwell Automation", short: "ROK", logoClass: "eng", field: "Engineering", subField: "Manufacturing", ats: "workday", tenant: "rockwellautomation", dc: "wd1", site: "External_Rockwell_Automation", positiveUsOnly: true },
  // Both marketing sites block servers; their Apply buttons open Oracle
  // Recruiting Cloud directly, which does not. See company-scrapers/kroll.js.
  { company: "Kroll", short: "KRLL", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "custom", handler: "kroll" },
  { company: "SAIC", short: "SAIC", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "saic" },
  { company: "Korn Ferry", short: "KFY", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "kornferry" },
  // Found by the Workday probe; both confirmed by hiringOrganization on a req
  // ("Alira Health SLU", "Impact Advisors LLC"). Alira is mostly Spain/France/
  // Italy, so its Country facet filters; Impact Advisors is US-only and writes
  // "US Remote", which positiveUsOnly would wrongly drop.
  { company: "Alira Health", short: "ALRA", logoClass: "health", field: "Healthcare", subField: "Health Systems", ats: "workday", tenant: "alirahealth", dc: "wd3", site: "Alirahealth", workdayFacets: { locationCountry: ["bc33aa3152ec42d4995f4791a106ed09"] } },
  { company: "Impact Advisors", short: "IMPA", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "workday", tenant: "impactadvisors", dc: "wd501", site: "Impactadvisors" },
  // WSP's job-opportunities page links reqs straight into Oracle Recruiting Cloud.
  { company: "WSP", short: "WSP", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "wsp" },
  // Burns & McDonnell — Taleo REST board on its own domain; see company-scrapers/burnsmcd.js.
  { company: "Burns & McDonnell", short: "BMCD", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "burnsmcd" },
  { company: "Stantec", short: "STN", logoClass: "eng", field: "Engineering", subField: "Infrastructure", ats: "custom", handler: "stantec" },
  { company: "Bates White", short: "BW", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "custom", handler: "bateswhite" },
  // jsheld.com/careers links each req on this SmartRecruiters board ("J.S. Held LLC").
  { company: "J.S. Held", short: "JSH", logoClass: "cons", field: "Consulting", subField: "Economic Consulting", ats: "smartrecruiters", board: "JSHeldLLC" },
  // The open-positions page reads this Lever board (page title "CrossCountry Consulting").
  { company: "CrossCountry Consulting", short: "XCC", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "lever", board: "crosscountry-consulting" },
  { company: "APCO Worldwide", short: "APCO", logoClass: "media", field: "Marketing", subField: "Brand", ats: "custom", handler: "apco" },
  // Capgemini's own job API, US-scoped server-side; see company-scrapers/capgemini.js.
  { company: "Capgemini", short: "CAP", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "custom", handler: "capgemini" },
  // SmartRecruiters ids read off each firm's own job pages; for PA, one of its
  // listed reqs (744000149388126) resolves under "PAConsulting" and no other id.
  { company: "PA Consulting", short: "PAC", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "smartrecruiters", board: "PAConsulting" },
  { company: "Endava", short: "DAVA", logoClass: "cons", field: "Consulting", subField: "Tech Consulting", ats: "smartrecruiters", board: "Endava" },
  // Health Advances: healthadvances.com is behind Cloudflare; its jobs are
  // ClearCompany's, whose own public board is not. See company-scrapers/healthadvances.js.
  { company: "Health Advances", short: "HADV", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "healthadvances" },
  { company: "BTS", short: "BTS", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "hrmdirect", board: "bts" },
  { company: "RSG", short: "RSG", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "hrmdirect", board: "rsg" },
  // iCIMS portals, confirmed by the portal's own title.
  { company: "Cadmus", short: "CDMS", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "custom", handler: "cadmus" },
  { company: "SKDK", short: "SKDK", logoClass: "media", field: "Marketing", subField: "Brand", ats: "custom", handler: "skdk" },
  // bursonglobal.com/careers reads this board (name "Burson"). Global, so gated.
  { company: "Burson", short: "BRSN", logoClass: "media", field: "Marketing", subField: "Brand", ats: "greenhouse", board: "bursonglobalcareers", positiveUsOnly: true },
  // Kearney — Yello job board (api/_shared/yello.js). Recorded as unreadable
  // before: its careers page renders the list with JavaScript, and the Yello
  // board it links to only server-renders 25 rows. The board's own search route
  // serves the rest.
  { company: "Kearney", short: "KRNY", logoClass: "cons", field: "Consulting", subField: "Strategy", ats: "custom", handler: "kearney" },
  // FTI's careers page links this site; Compass Lexecon sits on the same tenant.
  { company: "FTI Consulting", short: "FCN", logoClass: "cons", field: "Consulting", subField: "Management Consulting", ats: "workday", tenant: "fticonsulting", dc: "wd108", site: "FTIConsultingCareers", positiveUsOnly: true },

  // ── Finance, round three ──────────────────────────────────────────────
  // Two categories the registry had almost nothing in: digital-asset firms,
  // which hire heavily from quantitative and CS programmes, and venture
  // capital, which runs some of the most competitive analyst programmes there
  // are and appeared nowhere.
  { company: "Gemini", short: "GEM", logoClass: "fin", field: "Finance", subField: "Digital Assets", ats: "greenhouse", board: "gemini" },
  { company: "Ripple", short: "XRP", logoClass: "fin", field: "Finance", subField: "Digital Assets", ats: "greenhouse", board: "ripple" },
  { company: "Fireblocks", short: "FB", logoClass: "fin", field: "Finance", subField: "Digital Assets", ats: "greenhouse", board: "fireblocks" },
  { company: "BitGo", short: "BTGO", logoClass: "fin", field: "Finance", subField: "Digital Assets", ats: "greenhouse", board: "bitgo" },
  { company: "Mercury", short: "MERC", logoClass: "fin", field: "Finance", subField: "Fintech", ats: "greenhouse", board: "mercury" },
  { company: "General Catalyst", short: "GC", logoClass: "fin", field: "Finance", subField: "Venture Capital", ats: "greenhouse", board: "generalcatalyst" },
  { company: "Bessemer Venture Partners", short: "BVP", logoClass: "fin", field: "Finance", subField: "Venture Capital", ats: "greenhouse", board: "bessemerventurepartners" },

  // ── Finance, added 9 Sep 2026 ─────────────────────────────────────────
  // Exchanges, which the registry had almost none of despite being a standard
  // target for quantitative and markets-focused students.
  { company: "Nasdaq", short: "NDAQ", logoClass: "fin", field: "Finance", subField: "Exchanges", ats: "workday", tenant: "nasdaq", dc: "wd1", site: "Global_External_Site" },
  { company: "CME Group", short: "CME", logoClass: "fin", field: "Finance", subField: "Exchanges", ats: "workday", tenant: "cmegroup", dc: "wd1", site: "cme_careers" },
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

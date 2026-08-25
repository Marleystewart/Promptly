// Where the API lives. On the web the app is served from the same origin as its
// own functions, so a relative path is correct and stays correct on previews.
// Inside the iOS/Android shell the page loads from capacitor://localhost, which
// has no /api of its own — those builds must call production absolutely.
// window.Capacitor only exists in the native shell, so this is "" on the web.
const API_ORIGIN = "https://app.joinpromptly.co";
const API_BASE = window.Capacitor?.isNativePlatform?.() ? API_ORIGIN : "";

const COLLEGES = [
  "Abilene Christian University", "Agnes Scott College", "Alabama A&M University", "Alcorn State University",
  "American University", "Amherst College", "Arizona State University", "Auburn University",
  "Babson College", "Ball State University", "Barnard College", "Bates College", "Baylor University",
  "Belmont University", "Bentley University", "Bethune-Cookman University", "Boston College",
  "Boston University", "Bowdoin College", "Brandeis University", "Brown University", "Bryant University",
  "Bryn Mawr College", "Bucknell University", "California Institute of Technology",
  "California Polytechnic State University, San Luis Obispo", "Carnegie Mellon University",
  "Case Western Reserve University", "Chapman University", "Clark Atlanta University", "Clemson University",
  "Colby College", "Colgate University", "College of Charleston", "College of the Holy Cross",
  "College of William & Mary", "Colorado College", "Colorado State University", "Columbia University",
  "Cornell University", "Creighton University", "Dartmouth College", "Davidson College",
  "Delaware State University", "DePaul University", "Dickinson College", "Drexel University",
  "Duke University", "Duquesne University", "Elon University", "Embry-Riddle Aeronautical University",
  "Emory University", "Fairfield University", "Fisk University", "Florida A&M University",
  "Florida International University", "Florida State University", "Fordham University",
  "Franklin & Marshall College", "Furman University", "George Mason University",
  "George Washington University", "Georgetown University", "Georgia Institute of Technology",
  "Georgia State University", "Gonzaga University", "Grambling State University", "Grinnell College",
  "Hamilton College", "Hampton University", "Harvard University", "Harvey Mudd College",
  "Haverford College", "High Point University", "Hofstra University", "Howard University",
  "Illinois Institute of Technology", "Indiana University Bloomington", "Iowa State University",
  "Ithaca College", "Jackson State University", "James Madison University", "Johns Hopkins University",
  "Kansas State University", "Kennesaw State University", "Kenyon College", "Lafayette College",
  "Lehigh University", "Lincoln University", "Louisiana State University", "Loyola Marymount University",
  "Loyola University Chicago", "Loyola University Maryland", "Macalester College", "Manhattan College",
  "Marquette University", "Massachusetts Institute of Technology", "Miami University",
  "Michigan State University", "Middlebury College", "Mississippi State University", "Morehouse College",
  "Morgan State University", "Mount Holyoke College", "NC State University", "New York University",
  "North Carolina A&T State University", "Northeastern University", "Northwestern University",
  "Oberlin College", "Ohio State University", "Ohio University", "Oklahoma State University",
  "Oregon State University", "Pace University", "Penn State University", "Pepperdine University",
  "Pomona College", "Prairie View A&M University", "Princeton University", "Providence College",
  "Purdue University", "Rensselaer Polytechnic Institute", "Rhodes College", "Rice University",
  "Rochester Institute of Technology", "Rose-Hulman Institute of Technology", "Rutgers University",
  "Santa Clara University", "Savannah College of Art and Design", "Scripps College",
  "Seton Hall University", "Skidmore College", "Smith College", "Southern Methodist University",
  "Southern University and A&M College", "Spelman College", "St. John's University", "Stanford University",
  "Stevens Institute of Technology", "Stony Brook University", "Syracuse University",
  "Temple University", "Tennessee State University", "Texas A&M University",
  "Texas Christian University", "Trinity College", "Trinity University", "Tufts University",
  "Tulane University", "Union College", "University of Alabama", "University of Arizona",
  "University of Arkansas", "University of California, Berkeley", "University of California, Davis",
  "University of California, Irvine", "University of California, Los Angeles",
  "University of California, San Diego", "University of California, Santa Barbara",
  "University of Chicago", "University of Cincinnati", "University of Colorado Boulder",
  "University of Connecticut", "University of Delaware", "University of Denver",
  "University of Florida", "University of Georgia", "University of Houston",
  "University of Illinois Urbana-Champaign", "University of Iowa", "University of Kansas",
  "University of Kentucky", "University of Maryland", "University of Massachusetts Amherst",
  "University of Miami", "University of Michigan", "University of Minnesota",
  "University of Mississippi", "University of Missouri", "University of Nebraska-Lincoln",
  "University of North Carolina at Chapel Hill", "University of Notre Dame",
  "University of Oklahoma", "University of Oregon", "University of Pennsylvania",
  "University of Pittsburgh", "University of Richmond", "University of Rochester",
  "University of San Diego", "University of South Carolina", "University of South Florida",
  "University of Southern California", "University of Tennessee", "University of Texas at Austin",
  "University of Utah", "University of Vermont", "University of Virginia",
  "University of Washington", "University of Wisconsin-Madison", "Vanderbilt University",
  "Vassar College", "Villanova University", "Virginia Tech", "Wake Forest University",
  "Washington and Lee University", "Washington University in St. Louis", "Wellesley College",
  "Wesleyan University", "West Virginia University", "Williams College",
  "Winston-Salem State University", "Worcester Polytechnic Institute",
  "Xavier University of Louisiana", "Yale University",
];

const subFields = {
  Finance: ["All Finance", "Investment Banking", "Asset Management", "Private Equity", "Private Credit", "Hedge Fund", "Quant Trading", "Fintech", "Payments"],
  Consulting: ["All Consulting", "MBB", "Big 4", "Strategy", "Tech Consulting", "Economic Consulting"],
  Sports: ["All Sports", "Teams & Leagues", "Sports Media", "Sports Technology", "Sports Marketing"],
  "Real Estate": ["All Real Estate", "Development", "Investment", "Brokerage", "Property Technology"],
};

// Industry taxonomy — matches the data fields so a student's chosen interests
// map directly onto the tabs they see.
const FIELD_ORDER = [
  "Technology", "Finance", "Consulting", "Healthcare", "Law", "Government",
  "Media", "Marketing", "Consumer", "Engineering", "Science", "Nonprofit", "Education",
  "Sports", "Real Estate",
];
const fieldOptions = [...FIELD_ORDER];

const interestKeywords = {
  Technology: ["tech", "software", "computer", "coding", "data", "ai", "product", "cyber", "developer", "swe"],
  Finance: ["finance", "investment", "banking", "accounting", "money", "trading", "equity", "wealth", "ib"],
  Consulting: ["consulting", "strategy", "operations", "business analyst", "advisory"],
  Healthcare: ["health", "hospital", "clinic", "medical", "medicine", "pre-med", "nursing", "pharma", "biotech"],
  Law: ["law", "legal", "attorney", "pre-law", "justice", "litigation", "paralegal"],
  Government: ["government", "policy", "political", "public", "foreign", "intelligence", "federal", "diplomacy", "civic"],
  Media: ["media", "journalism", "music", "film", "news", "content", "entertainment", "broadcast", "writing"],
  Marketing: ["marketing", "advertising", "brand", "social media", "pr", "communications", "growth"],
  Consumer: ["consumer", "retail", "cpg", "merchandising", "fashion", "beauty", "supply chain"],
  Engineering: ["engineering", "mechanical", "aerospace", "civil", "electrical", "manufacturing", "energy", "automotive"],
  Science: ["science", "lab", "biology", "chemistry", "physics", "climate", "environment", "research"],
  Nonprofit: ["nonprofit", "social impact", "ngo", "charity", "volunteer", "humanitarian"],
  Education: ["education", "teaching", "learning", "school", "edtech", "tutoring"],
  Sports: ["sports", "athletics", "basketball", "football", "baseball", "soccer", "league", "team operations", "sports media"],
  // "development" used to live here and was the single worst keyword in this
  // map: it matches "player development", "product development", "MVP
  // development", "business development" — almost never real estate. Every
  // term here now has to be unambiguous about the industry.
  "Real Estate": ["real estate", "property", "brokerage", "commercial real estate", "proptech", "urban planning", "realtor", "leasing", "reit", "residential"],
};

const openings = [

  // ─────────────────────────────────────────────────────────────────────────
  // Live entries link to a specific job posting or dedicated program page.
  // Links are revalidated before release; closed roles become awaiting cards.
  // ─────────────────────────────────────────────────────────────────────────

  // ── Technology ────────────────────────────────────────────────────────────

  // Google — real open posting, specific job ID
  {
    company: "Google",
    short: "GOOG",
    logoClass: "tech",
    logo: "assets/logos/google.webp",
    field: "Technology",
    role: "Software Engineering Intern",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened recently",
    sourceLabel: "Google Careers – SWE Intern 2027",
    sourceUrl: "https://www.google.com/about/careers/applications/jobs/results/120997883141857990-software-engineering-intern/",
  },
  // ── Finance — Investment Banking ─────────────────────────────────────────

  // Goldman Sachs: specific 2027 Americas Summer Analyst program page
  {
    company: "Goldman Sachs",
    short: "GS",
    logoClass: "gs",
    logo: "assets/logos/goldman-sachs.png",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Summer Analyst Program",
    program: "Summer 2027",
    deadline: "Opens Aug 15, 2026",
    opened: "Applications open Aug 15, 2026",
    upcoming: true,
    sourceLabel: "Goldman Sachs – 2027 Summer Analyst Americas",
    sourceUrl: "https://higher.gs.com/campus?EXPERIENCE_LEVEL=Summer%20Analyst",
  },

  // ── Finance — Asset Management ────────────────────────────────────────────

  // BlackRock: specific 2027 AMERS Summer Internship posting (job ID 90628276544)
  {
    company: "BlackRock",
    short: "BLK",
    logoClass: "blk",
    field: "Finance",
    subField: "Asset Management",
    role: "2027 Summer Internship Program – AMERS",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Jan 14, 2026",
    sourceLabel: "BlackRock – 2027 Summer Internship AMERS",
    sourceUrl: "https://careers.blackrock.com/job/new-york/2027-summer-internship-program-amers/45831/90628276544",
  },

  // ── Finance — Amazon & Apple (verified specific postings) ────────────────

  {
    company: "Amazon",
    short: "AMZN",
    logoClass: "amzn",
    field: "Finance",
    role: "2027 Operations Finance Rotational Program Intern",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened recently",
    sourceLabel: "Amazon Jobs – Finance Rotational 2027",
    sourceUrl: "https://www.amazon.jobs/en/jobs/10435673/2027-amazon-operations-finance-rotational-program-summer-internship",
  },
  {
    company: "Amazon",
    short: "AMZN",
    logoClass: "amzn",
    field: "Finance",
    role: "2027 Finance Rotation Program – Accounting Intern",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened recently",
    sourceLabel: "Amazon Jobs – Finance Accounting 2027",
    sourceUrl: "https://amazon.jobs/en/jobs/10435671/2027-amazon-finance-rotation-program-accounting-intern",
  },
  {
    company: "Apple",
    short: "AAPL",
    logoClass: "apple",
    field: "Finance",
    role: "Finance Development Program – 2027 Internship",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened recently",
    sourceLabel: "Apple Jobs – Finance Development 2027",
    sourceUrl: "https://jobs.apple.com/en-us/details/200646124-0836/finance-development-program-2027-internship-opportunities",
  },

  // ── Consulting ────────────────────────────────────────────────────────────

  // McKinsey: specific job listing for Business Analyst Intern, deadline Aug 11 2026
  {
    company: "McKinsey & Company",
    short: "McK",
    logoClass: "mck",
    logo: "assets/logos/mckinsey.png",
    field: "Consulting",
    subField: "MBB",
    role: "Business Analyst Intern",
    program: "Summer 2027",
    deadline: "Aug 11, 2026",
    opened: "Opened Mar 1, 2026",
    sourceLabel: "McKinsey – Business Analyst Intern",
    sourceUrl: "https://www.mckinsey.com/careers/search-jobs/jobs/businessanalystintern-15275",
  },
  // BCG: specific job posting (job ID 57657)
  {
    company: "BCG",
    short: "BCG",
    logoClass: "bcg",
    field: "Consulting",
    subField: "MBB",
    role: "Associate, Internship – US Offices",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Apr 14, 2026",
    sourceLabel: "BCG – Associate Internship US",
    sourceUrl: null,
  },
  // Bain: specific job posting (job ID 10402)
  {
    company: "Bain & Company",
    short: "Bain",
    logoClass: "bain",
    logo: "assets/logos/bain.webp",
    field: "Consulting",
    subField: "MBB",
    role: "Associate Consultant Internship",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Mar 9, 2026",
    sourceLabel: "Bain – Associate Consultant Internship",
    sourceUrl: "https://www.bain.com/careers/find-a-role/position/?jobid=10402",
  },
  // PwC: entry-level portal (dedicated student/intern listing page)
  {
    company: "PwC",
    short: "PwC",
    logoClass: "pwc",
    field: "Consulting",
    subField: "Big 4",
    role: "Audit Intern – Summer 2027 (Destination CPA)",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened recently",
    sourceLabel: "PwC – Audit Intern Summer 2027",
    sourceUrl: null,
  },
  // Oliver Wyman: specific 2027 Summer Intern posting (Marsh McLennan ATS)
  {
    company: "Oliver Wyman",
    short: "OW",
    logoClass: "consult",
    logo: "assets/logos/oliverwyman.png",
    field: "Consulting",
    subField: "Strategy",
    role: "Oliver Wyman Summer 2027 Intern (US)",
    program: "Summer 2027",
    deadline: "See posting",
    opened: "Opened recently",
    sourceLabel: "Oliver Wyman – Summer 2027 Intern",
    sourceUrl: null,
  },

  // ── Finance — Investment Banking (verified specific 2027 postings) ─────────

  {
    company: "J.P. Morgan",
    short: "JPM",
    logoClass: "jpm",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Global Investment Banking Summer Analyst",
    program: "Summer 2027",
    deadline: "Jun 27, 2026",
    opened: "Opened Dec 28, 2025",
    sourceLabel: "J.P. Morgan – IB Summer Analyst Program",
    sourceUrl: "https://www.jpmorganchase.com/careers/explore-opportunities/programs/investment-banking-summer-analyst",
  },
  {
    company: "Morgan Stanley",
    short: "MS",
    logoClass: "ms",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Investment Banking Summer Analyst",
    program: "Summer 2027",
    deadline: "Feb 15, 2026",
    opened: "Opened Jan 1, 2026",
    sourceLabel: "Morgan Stanley – 2027 IB Summer Analyst",
    sourceUrl: "https://morganstanley.tal.net/vx/lang-en-GB/mobile-0/brand-2/candidate/so/pm/1/pl/1/opp/20793-2027-Investment-Banking-Summer-Analyst-Program-United-States/en-GB",
  },
  {
    company: "Bank of America",
    short: "BofA",
    logoClass: "boa",
    field: "Finance",
    subField: "Investment Banking",
    role: "Global Investment Banking Summer Analyst – 2027",
    program: "Summer 2027",
    deadline: "Mar 28, 2026",
    opened: "Opened Jan 14, 2026",
    sourceLabel: "Bank of America – Global IB Summer Analyst 2027",
    sourceUrl: null,
  },
  {
    company: "Citi",
    short: "Citi",
    logoClass: "citi",
    field: "Finance",
    subField: "Investment Banking",
    role: "Investment Banking Summer Analyst, 2027",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Dec 15, 2025",
    sourceLabel: "Citi – Investment Banking Summer Analyst 2027",
    sourceUrl: null,
  },
  {
    company: "Barclays",
    short: "BARC",
    logoClass: "bcs",
    field: "Finance",
    subField: "Investment Banking",
    role: "Banking Analyst (Coverage/M&A) Summer Internship 2027",
    program: "Summer 2027",
    deadline: "Mar 4, 2026",
    opened: "Opened Nov 30, 2025",
    sourceLabel: "Barclays – Banking Summer Internship 2027",
    sourceUrl: null,
  },
  {
    company: "Lazard",
    short: "LAZ",
    logoClass: "laz",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Financial Advisory Summer Analyst (M&A / Restructuring)",
    program: "Summer 2027",
    deadline: "Feb 20, 2026",
    opened: "Opened Dec 14, 2025",
    sourceLabel: "Lazard – 2027 Financial Advisory Summer Analyst",
    sourceUrl: "https://lazard-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/candidate/so/pm/1/pl/2/opp/4124-2027-Financial-Advisory-Summer-Analyst-Program-New-York-M-A-and-Restructuring-Generalist/en-GB",
  },
  {
    company: "Jefferies",
    short: "JEF",
    logoClass: "jef",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Investment Banking Summer Analyst",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Dec 14, 2025",
    sourceLabel: "Jefferies – 2027 IB Summer Analyst",
    sourceUrl: "https://jefferies.tal.net/candidate/so/pm/1/pl/2/opp/1724-2027-investment-banking-summer-analyst-program-new-york-private-fund-advisory-group",
  },
  {
    company: "RBC Capital Markets",
    short: "RBC",
    logoClass: "rbc",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Global Investment Banking Summer Analyst",
    program: "Summer 2027",
    deadline: "Jan 30, 2026",
    opened: "Opened Nov 4, 2025",
    sourceLabel: "RBC – 2027 Global IB Summer Analyst",
    sourceUrl: null,
  },
  {
    company: "Wells Fargo",
    short: "WF",
    logoClass: "wf",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Summer Internship – Investment Banking",
    program: "Summer 2027",
    deadline: "Apr 29, 2026",
    opened: "Opened Dec 31, 2025",
    sourceLabel: "Wells Fargo – 2027 IB Summer Internship",
    sourceUrl: null,
  },
  {
    company: "Moelis & Company",
    short: "MOE",
    logoClass: "moe",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Summer Analyst, Investment Banking",
    program: "Summer 2027",
    deadline: "Feb 20, 2026",
    opened: "Opened Nov 25, 2025",
    sourceLabel: "Moelis – 2027 IB Summer Analyst",
    sourceUrl: "https://moelis-careers.tal.net/vx/lang-en-GB/mobile-0/appcentre-1/brand-4/xf-d43c9a446dde/candidate/so/pm/1/pl/2/opp/355-2027-Summer-Analyst-Investment-Banking-New-York-City/en-GB",
  },
  {
    company: "Guggenheim Securities",
    short: "GUG",
    logoClass: "gug",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Investment Banking Summer Analyst (NY Generalist)",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Jan 4, 2026",
    sourceLabel: "Guggenheim Securities – 2027 IB Summer Analyst",
    sourceUrl: null,
  },
  {
    company: "PJT Partners",
    short: "PJT",
    logoClass: "pjt",
    field: "Finance",
    subField: "Investment Banking",
    role: "2027 Summer Analyst",
    program: "Summer 2027",
    deadline: "May 24, 2026",
    opened: "Opened Jan 1, 2026",
    sourceLabel: "PJT Partners – 2027 Summer Analyst",
    sourceUrl: null,
  },

  // ── Finance — Private Equity (verified specific 2027 postings) ─────────────

  {
    company: "Bain Capital",
    short: "BCap",
    logoClass: "bcap",
    field: "Finance",
    subField: "Private Equity",
    role: "2027 Summer Analyst, Path into Private Equity",
    program: "Summer 2027",
    deadline: "May 24, 2026",
    opened: "Opened Jan 1, 2026",
    sourceLabel: "Bain Capital – 2027 PE Summer Analyst",
    sourceUrl: null,
  },
  {
    company: "General Atlantic",
    short: "GA",
    logoClass: "ga",
    field: "Finance",
    subField: "Private Equity",
    role: "2027 Summer Analyst, Class of 2028",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Jan 5, 2026",
    sourceLabel: "General Atlantic – 2027 Summer Analyst",
    sourceUrl: null,
  },
  {
    company: "Ares Management",
    short: "ARES",
    logoClass: "ares",
    field: "Finance",
    subField: "Private Equity",
    role: "2027 Summer Intern",
    program: "Summer 2027",
    deadline: "Opens Aug 31, 2026",
    opened: "Applications open Aug 2026",
    sourceLabel: "Ares Management – 2027 Summer Intern",
    sourceUrl: null,
  },

  // ── Finance — Hedge Funds & Asset Management (verified specific 2027) ──────

  {
    company: "Point72",
    short: "P72",
    logoClass: "p72",
    field: "Finance",
    subField: "Hedge Fund",
    role: "2027 Point72 Academy Investment Analyst Intern",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Nov 19, 2025",
    sourceLabel: "Point72 – 2027 Academy Investment Analyst",
    sourceUrl: null,
  },
  {
    company: "D.E. Shaw",
    short: "DES",
    logoClass: "des",
    field: "Finance",
    subField: "Hedge Fund",
    role: "Fundamental Research Analyst Intern – Summer 2027",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Jan 8, 2026",
    sourceLabel: "D.E. Shaw – Fundamental Research Analyst Intern 2027",
    sourceUrl: "https://www.deshaw.com/careers/fundamental-research-analyst-intern-new-york-summer-2027-5709",
  },
  {
    company: "AQR Capital Management",
    short: "AQR",
    logoClass: "aqr",
    field: "Finance",
    subField: "Hedge Fund",
    role: "2027 Research Summer Analyst",
    program: "Summer 2027",
    deadline: "May 14, 2026",
    opened: "Opened recently",
    sourceLabel: "AQR – 2027 Research Summer Analyst",
    sourceUrl: "https://careers.aqr.com/jobs/open-positions/greenwich-ct/2027-research-summer-analyst/7895583?gh_jid=7895583",
  },
  {
    company: "Millennium",
    short: "MLP",
    logoClass: "mlp",
    field: "Finance",
    subField: "Hedge Fund",
    role: "Millennium Investment Internship 2027",
    program: "Summer 2027",
    deadline: "Rolling",
    opened: "Opened Feb 26, 2026",
    sourceLabel: "Millennium – Investment Internship 2027",
    sourceUrl: null,
  },
];

// These postings were confirmed closed or redirected away from the role on
// June 30, 2026. Keep the companies visible as watch targets, but never show
// an official-posting button until a verified live feed replaces the card.
const closedCuratedCompanies = new Set([
  "BCG", "PwC", "Oliver Wyman", "Bank of America", "Citi", "Barclays",
  "RBC Capital Markets", "Wells Fargo", "Guggenheim Securities", "PJT Partners",
  "Bain Capital", "General Atlantic", "Ares Management", "Point72", "Millennium",
]);
for (const item of openings) {
  if (!closedCuratedCompanies.has(item.company)) continue;
  Object.assign(item, {
    deadline: "—",
    opened: "Awaiting posting",
    sourceLabel: null,
    sourceUrl: null,
    awaiting: true,
    curatedAwaiting: true,
  });
}

// ── Honest "Browse careers" treatment ────────────────────────────────────
// Marquee employers on custom/SPA career sites (Google, Apple, McKinsey…)
// can't be deep-linked reliably: a specific job-ID URL returns HTTP 200 but
// renders "job not found" once the req expires. Rather than show a broken
// "Open Official Posting" button, we point these at the company's STABLE
// careers/search page and label the button honestly as "Browse … careers".
// The pipeline (live ATS feeds) remains the ONLY source of verified deep
// links. Careers roots below were probed live (2026-07).
// Each destination below was opened in a browser and its results read, on
// 2026-08-03. Where a filter is applied it is because it was seen to work —
// several plausible-looking parameters are silently ignored by these sites
// (McKinsey drops `locations`, Amazon drops `loc_query`), which produces a URL
// that looks filtered and isn't. Don't add one here without loading it first.
const browseCareers = {
  "Google": "https://www.google.com/about/careers/applications/jobs/results/?q=intern%202027",
  // team= is Apple's real student filter; the old `search=intern` returned
  // Manager and Staff Engineer roles.
  "Apple": "https://jobs.apple.com/en-us/search?team=internships-STDNT-INTRN",
  // base_query is "intern", not "2027 intern": the narrower phrase returns
  // ZERO results once a city filter is applied, which is worse than no filter.
  "Amazon": "https://www.amazon.jobs/en/search?base_query=intern",
  // Student & graduate category, rather than the corporate careers homepage.
  "BlackRock": "https://careers.blackrock.com/category/students-and-graduates-jobs/45831/9022304/1",
  "Bain & Company": "https://www.bain.com/careers/",
  // Real job search, intern filter + US only. The country value must be the
  // full name — `countries=US` is silently ignored and returns Geneva, Paris
  // and Brisbane. Taken from McKinsey's own UI: 46 roles → 7 US roles.
  "McKinsey & Company": "https://www.mckinsey.com/careers/search-jobs?query=intern&countries=United+States",
  // Student/early-career pages instead of corporate careers landing pages.
  "Morgan Stanley": "https://www.morganstanley.com/people-opportunities/students-graduates",
  "Lazard": "https://icbpjb.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/LazardStudentCareers/jobs",
  "Jefferies": "https://www.jefferies.com/careers/students-and-graduates/",
  "Moelis & Company": "https://moelis.wd1.myworkdayjobs.com/University-Hires",
  "D.E. Shaw": "https://www.deshaw.com/careers/internships",
  "AQR Capital Management": "https://careers.aqr.com/jobs/category/university-jobs",
  // Stable official program landing pages (not job-ID deep links) — kept as
  // the destination but relabeled honestly (program overviews, not one req).
  "Goldman Sachs": "https://higher.gs.com/campus?EXPERIENCE_LEVEL=Summer%20Analyst",
  "J.P. Morgan": "https://jpmc.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1001/requisitions?keyword=2027%20Summer%20Analyst",
};
// A browse card stands for a COMPANY we cannot read, not for a specific req.
// Two curated Amazon rows therefore collapsed into two identical cards — same
// link, same "Internship roles" label — which is exactly the duplication that
// makes a feed look padded. Keep one card per browse company.
const browseSeen = new Set();
for (let i = openings.length - 1; i >= 0; i -= 1) {
  const item = openings[i];
  const url = browseCareers[item.company];
  if (!url || item.curatedAwaiting) continue;
  if (browseSeen.has(item.company)) {
    openings.splice(i, 1);
    continue;
  }
  browseSeen.add(item.company);
  item.sourceUrl = url;
  item.browse = true;
  item.sourceLabel = `${item.company} Careers — browse ${item.program || "2027"} roles`;
}

// ── Location on browse links ─────────────────────────────────────────────
// ONLY these two were verified to honour a free-text location in the query
// string. Apple needs an internal slug ("new-york-city-NYC") that can't be
// derived from whatever a student types, and McKinsey ignores location
// entirely — so neither gets a location appended rather than pretending to
// filter. This is why a "New York" preference could return roles in India:
// the links were never location-aware at all.
// Promptly is a US product — the live pipeline drops international postings
// outright (see the aggregator). Browse links have to hold the same line, so
// with no city preference they fall back to a whole-US filter rather than an
// unscoped search that can surface London or Bangalore roles.
const US_WIDE = "United States";

const browseLocationQuery = {
  Google: (location) => `&location=${encodeURIComponent(location || US_WIDE)}`,
  // Amazon matches on the city alone — "New York, NY" returns nothing — and
  // country=USA on its own is a valid US-wide filter.
  Amazon: (location) => (location
    ? `&city=${encodeURIComponent(location.split(",")[0].trim())}&country=USA`
    : "&country=USA"),
};

function studentLocationPreference() {
  const value = String(profile.preferredLocation || "").trim();
  if (!value || /^no preference$/i.test(value) || /^remote$/i.test(value)) return "";
  return value;
}

// The destination for a browse card, narrowed to the student's location where
// the employer's site actually supports it.
function browseUrlFor(item) {
  const base = item.sourceUrl || "";
  const build = browseLocationQuery[item.company];
  if (!base || !build) return base;
  // Called even with no preference, so the US-wide fallback still applies.
  return base + build(studentLocationPreference());
}

// True when the link is narrowed to the student's own city (not merely to the US).
function browseIsLocationFiltered(item) {
  return Boolean(browseLocationQuery[item.company]) && Boolean(studentLocationPreference());
}

// Employers whose destination is US-scoped even without a city preference —
// either because we add a country filter or because the page itself is the
// firm's US/Americas student page.
const US_SCOPED_BROWSE = new Set([
  "Google", "Amazon", "McKinsey & Company", "Goldman Sachs", "J.P. Morgan",
]);

function browseIsUsScoped(item) {
  return US_SCOPED_BROWSE.has(item.company);
}

// Every curated opening carries a cycle (derived from its program label) so
// the whole app can reason about recruiting cycles uniformly with live data.
for (const item of openings) {
  if (!item.cycle) item.cycle = item.program || "Summer 2027";
}

// Which recruiting cycles matter to a student, from their graduation year:
// juniors/sophomores → internships 1–2 years out (any season); seniors/recent
// grads → New Grad full-time. Year-based so "Fall 2026" and "Summer 2026"
// both count for a student eligible for the 2026 cycle.
function eligibleInternYears(gradYear) {
  const gy = parseInt(gradYear, 10);
  if (!gy) return null;
  return [gy - 2, gy - 1].filter((y) => y >= 2026 && y <= 2028);
}
function cycleMatchesProfile(item) {
  const gy = parseInt(profile.gradYear, 10);
  if (!gy || !item.cycle) return true;
  const yearMatch = String(item.cycle).match(/20\d\d/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
  const isNewGrad = /new grad/i.test(item.cycle);
  if (!year) return true; // undated "New Grad" / "Internship" — always plausible
  if (isNewGrad) return year === gy;
  return (eligibleInternYears(gy) || []).includes(year); // internship (any season)
}
// Human-readable list of the cycles a student is targeting (for the note).
function relevantCycleLabels(gradYear) {
  const gy = parseInt(gradYear, 10);
  if (!gy) return null;
  const labels = (eligibleInternYears(gy) || []).map((y) => `${y} internships`);
  labels.push(`New Grad ${gy}`);
  return labels;
}

// Watch-list directory: companies we track that have no live posting yet.
// They render as "Awaiting 2027 posting" cards until the pipeline finds a real
// listing, then the placeholder is replaced by the verified opening.
const watchlist = (typeof window !== "undefined" && Array.isArray(window.WATCHLIST)) ? window.WATCHLIST : [];

function rebuildPlaceholders() {
  // remove old placeholders
  for (let i = openings.length - 1; i >= 0; i--) {
    if (openings[i].awaiting && !openings[i].curatedAwaiting) openings.splice(i, 1);
  }
  // add a placeholder for any watched company that has no real opening
  const have = new Set(openings.map((o) => o.company.toLowerCase()));
  for (const c of watchlist) {
    if (have.has(c.company.toLowerCase())) continue;
    openings.push({
      company: c.company,
      short: c.short,
      logoClass: c.logoClass || "fin",
      logo: c.logo,
      field: c.field,
      subField: c.subField,
      role: "2027 Summer Internship",
      program: "Summer 2027",
      deadline: "—",
      opened: "Awaiting posting",
      sourceLabel: null,
      sourceUrl: null,
      awaiting: true,
      generatedPlaceholder: true,
    });
  }
}

// Industry tabs the student actually sees = the fields they picked in their
// profile (intersected with fields we have data for). No profile yet -> show
// all. So a finance student doesn't see Law/Media tabs, etc.
function availableFields() {
  const present = new Set(openings.map((o) => o.field));
  return FIELD_ORDER.filter((f) => present.has(f));
}
function userFields() {
  const avail = availableFields();
  if (!Array.isArray(profile.fields) || !profile.fields.length) return avail;
  const chosen = avail.filter((f) => profile.fields.includes(f));
  return chosen.length ? chosen : avail;
}
function renderFilterChips() {
  const fields = userFields();
  const feed = document.querySelector(".search-panel .filter-row");
  if (feed) feed.innerHTML = ["All", ...fields, "Saved"].map((f, i) => `<button class="filter-chip${i === 0 ? " active" : ""}">${f}</button>`).join("");
  const dash = document.querySelector('.filter-row[aria-label="Industry filters"]');
  if (dash) dash.innerHTML = fields.map((f) => `<button class="filter-chip">${f}</button>`).join("");
}

const profile = {
  name: "",
  email: "",
  school: "",
  gradYear: "",
  major: "",
  preferredLocation: "",
  remoteOkay: true,
  willingToRelocate: false,
  interests: "",
  photoDataUrl: "",
  resumeName: "",
  resumeText: "",
  fields: [],
  // Fields the student turned on/off by hand, kept apart from the ones inferred
  // from their major, interests, and résumé (see syncInferredFields).
  manualFieldsOn: [],
  manualFieldsOff: [],
  savedAlerts: [],
  watches: [],
  emailNotifications: true,
  pushNotifications: true,
  weeklyRecap: true,
  deadlineReminders: true,
};

const views = document.querySelectorAll(".view");
const title = document.querySelector("[data-title]");
const modal = document.querySelector(".details-modal");
const profileModal = document.querySelector("[data-profile-modal]");
const modalCompany = document.querySelector("[data-modal-company]");
const savedList = document.querySelector(".saved-list");
const emptyState = document.querySelector(".empty-state");
const fieldGrid = document.querySelector("[data-field-grid]");
const pushStatus = document.querySelector("[data-push-status]");
const saved = new Map();
const fallbackVapidPublicKey = "BCyh-h_0nZhnY6w4HNnvVD1HfCDG_cQfTwg-sLRIPO2yNAjwQdi5dckUS3NKNijENU5SI9uweHVga4ZlvZHlOB8";
const profileStorageKey = "openingProfile";
const savedStorageKey = "promptlySavedCompanies";
let authClient = null;
let authUser = null;
let authMode = "signup";
// True while an OAuth redirect (e.g. Google) is being exchanged for a session.
// The onboarding fallback timer must not flip the screen back to sign-up
// while this is in flight — that caused a post-Google-login glitch where the
// user was bounced from the school/grade form back to the sign-in page.
let pendingOAuthCallback = false;
// Real timestamp of the last pipeline refresh, shown next to the tracked count.
let liveFeedUpdatedAt = null;

// Whether this email has confirmed itself. Server-owned; the client only
// reflects what /api/subscribe reports. Declared up here because
// applyProfileToUI() reads it, and `let` has no hoisting — leaving it further
// down threw a temporal-dead-zone error that a try/catch quietly swallowed.
let emailVerified = false;
let accountSyncTimer = null;
let accountSyncPaused = false;

// --- Application status tracker (Applied → OA → Interview → Offer) ----------
// Gives students a reason to come back while remaining strictly device-only.
// A stage at a named company plus an exact school can identify someone in a
// small cohort, so progress is never sent to analytics or the backend.
const statusStorageKey = "promptlyStatuses";
const statuses = new Map();
(function loadStatuses() {
  try {
    const raw = JSON.parse(localStorage.getItem(statusStorageKey) || "{}");
    Object.entries(raw).forEach(([k, v]) => statuses.set(k, v));
  } catch {}
})();
function persistStatuses() {
  try { localStorage.setItem(statusStorageKey, JSON.stringify(Object.fromEntries(statuses))); } catch {}
}
function migrateLegacyStatuses() {
  const result = window.PromptlyListingState.migrateLegacyEntries(statuses, openings);
  if (!result.changed) return;
  statuses.clear();
  result.entries.forEach((value, key) => statuses.set(key, value));
  persistStatuses();
}
function setStatus(reference, stage) {
  const item = resolveOpening(reference);
  if (!item) return;
  const listingKey = alertIdentity(item);
  if (stage) statuses.set(listingKey, stage); else statuses.delete(listingKey);
  persistStatuses();
  renderStatusTracker(item);
  renderOpenings();
  refreshSavedList();
}
function statusPill(item) {
  const s = statuses.get(alertIdentity(item));
  return s ? `<span class="row-status status-${s.toLowerCase()}">${s}</span>` : "";
}
function renderStatusTracker(item) {
  const tracker = modal.querySelector("[data-status-tracker]");
  if (!tracker) return;
  const current = item ? statuses.get(alertIdentity(item)) || "" : "";
  tracker.querySelectorAll("[data-status]").forEach((b) => {
    b.classList.toggle("active", b.dataset.status === current && current !== "");
  });
}

// Real-logo pipeline: curated asset file → domain-keyed logo service → colored
// initials tile. The domain map lives in watchlist.js (COMPANY_DOMAINS), so
// live-feed companies get real logos too. Swappable provider, keyless.
// Logos are served only from our own assets. We deliberately do NOT fall back
// to a third-party favicon service: doing so told that provider which employer
// each student was looking at, tied to their IP. A company without a bundled
// logo file gets the colored initials tile instead, which costs nothing and
// leaks nothing.

function companyDomain(item) {
  return item.domain || (window.COMPANY_DOMAINS || {})[item.company] || "";
}

function companyLogoUrl(item) {
  return item.logo || ""; // bundled asset only; otherwise the initials tile
}

// If a bundled logo file is missing, swap in the colored initials tile so a
// broken icon is never shown. Wired as a delegated capture listener rather than
// an inline onerror attribute, which a strict Content-Security-Policy blocks.
function logoFallback(img) {
  // Timeline markers already render initials underneath the image and carry a
  // tooltip, so only the broken <img> is removed — the textContent rewrite
  // below would destroy both.
  const marker = img.closest(".cycle-marker");
  if (marker) {
    img.remove();
    if (img.dataset.lc) marker.classList.add(img.dataset.lc);
    return;
  }

  const el = img.closest(".logo, .modal-logo, .mega-logo");
  if (!el) return;
  el.classList.remove("logo-tile");
  if (img.dataset.lc) el.classList.add(img.dataset.lc);
  el.textContent = img.dataset.short || "";
}

// Escape untrusted text before it goes into innerHTML. Live listings come
// from external ATS feeds — a job title must never be able to inject markup.
// Only ever hand an https URL to an href. Anything else (javascript:, data:,
// a malformed value from a feed) becomes empty and the link is hidden.
function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

function logoMarkup(item) {
  const url = companyLogoUrl(item);
  if (url) {
    return `<div class="logo logo-tile"><img src="${esc(url)}" alt="${esc(item.company)} logo" loading="lazy" data-logo-img data-short="${esc(item.short || "")}" data-lc="${esc(item.logoClass || "")}" /></div>`;
  }
  return `<div class="logo ${esc(item.logoClass)}">${esc(item.short)}</div>`;
}

// Parse a deadline string like "Feb 15, 2026" -> timestamp. "Rolling",
// "See posting", "Opens ..." etc. return null (treated as open).
function parseDateFromLabel(s) {
  if (!s) return null;
  const m = String(s).match(/([A-Za-z]{3,9})\s+(\d{1,2}),\s*(20\d{2})/);
  if (!m) return null;
  const t = Date.parse(`${m[1]} ${m[2]}, ${m[3]}`);
  return isNaN(t) ? null : t;
}
function parseDeadline(s) {
  if (!s || /^(opens|rolling|see posting|—)/i.test(String(s).trim())) return null;
  return parseDateFromLabel(s);
}
function parseOpeningDate(item) {
  const labels = [item.opensAt, item.deadline, item.opened].filter(Boolean);
  const label = labels.find((value) => /^applications open|^opens/i.test(String(value).trim()));
  return label ? parseDateFromLabel(label) : null;
}
function listingStatus(item) {
  if (item.awaiting) return "AWAITING";
  // A "browse" entry points at a careers SEARCH page, not a specific req we
  // read from the employer. It must never be counted or displayed as a
  // verified live posting — presence in an employer's own feed is the whole
  // basis for that word, and these were never in one.
  if (item.browse) return "BROWSE";
  const opens = parseOpeningDate(item);
  if (opens && opens > Date.now()) return "UPCOMING";
  const d = parseDeadline(item.deadline);
  if (d && d < Date.now()) return "CLOSED";
  return "OPEN";
}
// A listing behaves as "awaiting" if it's a watch-list placeholder OR a real
// posting whose deadline has passed (closed -> we wait for it to reopen).
function isAwaitingLike(item) {
  return listingStatus(item) !== "OPEN";
}
// True only for companies whose job system we actually pull (see monitored.js,
// generated from the source registry). We must not promise an alert for an
// employer we cannot read — firms like McKinsey and Apple publish no machine
// readable board, so for those we say so and point at the watch flow instead.
const monitoredCompanies = new Set(
  (typeof window !== "undefined" && Array.isArray(window.MONITORED_COMPANIES) ? window.MONITORED_COMPANIES : [])
    .map((name) => String(name).trim().toLowerCase())
);

function isMonitored(item) {
  return monitoredCompanies.has(String(item.company || "").trim().toLowerCase());
}

// Returns PLAIN TEXT, never HTML. The caller escapes it — these strings
// interpolate the student's own preferred location and, for watched companies,
// a name derived from a URL they pasted, so an unescaped path here is an
// injection sink. Keep it that way: no markup in any branch below.
function awaitingLine(item) {
  const status = listingStatus(item);
  if (status === "BROWSE") {
    const location = studentLocationPreference();
    // Say which it is. A search that isn't location-filtered can return roles
    // anywhere in the world, and the student should know that before clicking.
    const preface = `${item.company} does not publish a job feed Promptly can read, so we cannot confirm a specific opening.`;
    if (browseIsLocationFiltered(item)) return `${preface} This opens their official careers search, filtered to ${location}.`;
    if (browseIsUsScoped(item)) return `${preface} This opens their official US careers search — add a preferred location and we'll narrow it to your city.`;
    return `${preface} This opens their official student careers page, which we can't filter by location — roles may be outside the US.`;
  }
  if (status === "UPCOMING") return `Applications open ${new Date(parseOpeningDate(item)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Promptly will alert you when it is live.`;
  if (status === "CLOSED") return "Applications closed. Promptly will alert you when they reopen.";
  if (isMonitored(item)) return "Awaiting the 2027 posting. Promptly is watching their job system and will alert you the moment it opens.";
  return "This employer does not publish a job feed Promptly can read, so we cannot promise an alert. Paste their careers link and we will watch it for you.";
}

function openingRow(item) {
  const match = openingMatch(item);
  const listingKey = alertIdentity(item);
  const isSaved = saved.has(listingKey);
  if (isAwaitingLike(item)) {
    return `
    <article class="opening-row awaiting" data-company="${esc(item.company)}" data-field="${esc(item.field)}" data-open-details="${esc(listingKey)}" tabindex="0" role="button" aria-label="Track ${esc(item.company)} for 2027 postings">
      ${logoMarkup(item)}
      <div>
        <span class="status-pill">${esc(item.field)}${item.subField ? " · " + esc(item.subField) : ""}</span>${statusPill(item)}
        <h3>${esc(item.company)}</h3>
        <p>${listingStatus(item) === "BROWSE"
          ? `Internship roles · ${esc(item.program)}`
          : `${esc(item.role)} · ${esc(item.program)}`}</p>
        <small class="awaiting-line">${esc(awaitingLine(item))}</small>
        ${isAwaitingLike(item) && !isMonitored(item) && listingStatus(item) === "AWAITING"
          ? `<button class="tiny-action watch-this-btn" data-watch-company-name="${esc(item.company)}" type="button">Watch ${esc(item.company)}</button>`
          : ""}
      </div>
      <div class="row-actions">
        <button class="round-btn save-btn ${isSaved ? "saved" : ""}" aria-label="${isSaved ? "Untrack" : "Track"} ${esc(item.company)}" data-save="${esc(listingKey)}" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
      </div>
    </article>
  `;
  }
  return `
    <article class="opening-row" data-company="${esc(item.company)}" data-field="${esc(item.field)}" data-open-details="${esc(listingKey)}" tabindex="0" role="button" aria-label="View ${esc(item.role)} at ${esc(item.company)}">
      ${logoMarkup(item)}
      <div>
        <span class="status-pill">${esc(item.field)}</span>${statusPill(item)}
        <h3>${esc(item.company)}</h3>
        <p>${esc(item.role)} · ${esc(item.program)}</p>
        <small>Closes: ${esc(item.deadline)} · ${esc(item.opened)}</small>
        ${item.location ? `<small class="location-line">Location: ${esc(item.location)}</small>` : ""}
        <small class="match-line">Student fit: ${esc(match.label)}</small>
        <small class="source-line">Verified source: ${esc(item.sourceLabel || "Official careers page")}</small>
      </div>
      <div class="row-actions">
        <button class="round-btn save-btn ${isSaved ? "saved" : ""}" aria-label="${isSaved ? "Unsave" : "Save"} ${esc(item.role)} at ${esc(item.company)}" data-save="${esc(listingKey)}" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
        <button class="round-btn primary" aria-label="View ${esc(item.role)} at ${esc(item.company)}" data-open-details-button="${esc(listingKey)}">
          <svg viewBox="0 0 24 24"><path d="M8 5h11v11"/><path d="M19 5 7 17"/><path d="M5 9v10h10"/></svg>
        </button>
      </div>
    </article>
  `;
}

function preferredOpenings() {
  // In range first (graduated expansion, see locationSearch), then verified
  // listings before placeholders, then by fit — with distance as the
  // tie-breaker so the closest of two equally good roles wins.
  return [...currentLocationResult().items]
    .sort((a, b) => {
      const awaiting = (isAwaitingLike(a) ? 1 : 0) - (isAwaitingLike(b) ? 1 : 0);
      if (awaiting) return awaiting;
      const fit = openingMatch(b).score - openingMatch(a).score;
      if (fit) return fit;
      const da = distanceToListing(a);
      const db = distanceToListing(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
}

function profileMatchText() {
  return [profile.major, profile.interests, profile.school, profile.preferredLocation, profile.fields.join(" "), profile.resumeText].join(" ").toLowerCase();
}

// ── Location search ───────────────────────────────────────────────────────
// Graduated radius expansion. A hard radius is wrong in both directions: too
// tight and a student in rural Arkansas sees "no internships found", too loose
// and someone in Philadelphia gets Pittsburgh. So we start tight and widen only
// as far as we must to find something, and we always say what we did.
//
// Distances are real great-circle miles (see geo.js), not string matching.

const LOCATION_STEPS = [25, 50, 75, 100];
const MIN_LOCAL_RESULTS = 6;   // widen until we have at least this many
const geo = typeof window !== "undefined" ? window.PromptlyGeo : null;

let locationCache = { text: null, value: null };

// The student's location, resolved once per distinct input.
function studentPoint() {
  const text = String(profile.preferredLocation || "").trim();
  if (!text || /^no preference$/i.test(text)) return null;
  if (locationCache.text === text) return locationCache.value;
  const value = geo ? geo.resolve(text) : null;
  locationCache = { text, value };
  return value;
}

const listingPointCache = new Map();
function listingPoint(item) {
  const text = String(item.location || "").trim();
  if (!text) return null;
  if (listingPointCache.has(text)) return listingPointCache.get(text);
  const value = geo ? geo.resolve(text) : null;
  listingPointCache.set(text, value);
  return value;
}

// Miles from the student to a listing, or null when either side is unknown.
function distanceToListing(item) {
  const from = studentPoint();
  const to = listingPoint(item);
  if (!from || !to || from.kind !== "point" || to.kind !== "point" || !geo) return null;
  return geo.milesBetween(from, to);
}

function listingIsRemote(item) {
  return Boolean(item.remote) || (geo ? geo.isRemoteText(item.location) : /remote/i.test(String(item.location || "")));
}

// Fallback for towns and listing strings geo can't place: the old substring
// behaviour, so an unrecognised location degrades to "loosely matched" rather
// than vanishing.
function looseLocationMatch(item) {
  const preferred = String(profile.preferredLocation || "").toLowerCase().trim();
  const listing = String(item.location || "").toLowerCase();
  if (!preferred || !listing) return true;
  const tokens = preferred.split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  if (!tokens.length) return true;
  return tokens.some((token) => listing.includes(token));
}

// Runs the expansion and reports what it had to do to find results.
// → { items, message, radius, expanded }
function locationSearch(pool) {
  const from = studentPoint();
  const live = pool.filter((item) => !isAwaitingLike(item));

  // No usable preference: everything, no explanation needed.
  if (!from) return { items: pool, message: "", radius: null, expanded: false };

  if (from.kind === "ambiguous") {
    return {
      items: pool,
      message: `“${from.label}” matches more than one place (${from.options.slice(0, 3).join(", ")}). Add the state so we can narrow it down.`,
      radius: null, expanded: true,
    };
  }

  // Willing to relocate: nothing is out of bounds, but still rank near first.
  if (profile.willingToRelocate) {
    return { items: pool, message: "", radius: null, expanded: false };
  }

  const remoteOk = profile.remoteOkay !== false;
  const remotes = remoteOk ? live.filter(listingIsRemote) : [];
  const placed = live.filter((item) => distanceToListing(item) !== null);
  const unplaceable = live.filter((item) => distanceToListing(item) === null && looseLocationMatch(item));

  const within = (miles) => placed.filter((item) => distanceToListing(item) <= miles);
  const label = from.label;

  // We only pinned this to the middle of the state, so every distance below is
  // an approximation. Say so rather than quoting a confident "within 25 miles".
  const approximate = from.precision === "state";
  const approxNote = approximate
    ? ` We couldn't place that town exactly, so this is measured from the middle of the state — add a nearby city for tighter results.`
    : "";

  // Levels 1–4: widen the radius only as far as needed.
  const baseCount = within(LOCATION_STEPS[0]).length;
  for (const miles of LOCATION_STEPS) {
    const hits = within(miles);
    const total = new Set([...hits, ...remotes, ...unplaceable]);
    const enough = total.size >= MIN_LOCAL_RESULTS;
    if (enough || (miles === LOCATION_STEPS[0] && hits.length)) {
      if (enough || hits.length) {
        const widened = miles !== LOCATION_STEPS[0];
        // baseCount, not hits.length — the message is about what was available
        // at 25 miles, which is the reason we widened in the first place.
        const message = widened
          ? `${baseCount ? `Only ${baseCount} role${baseCount === 1 ? "" : "s"}` : "Nothing"} within 25 miles of ${label}, so we widened the search to ${miles} miles.${approxNote}`
          : (approximate ? `Showing roles near ${label}.${approxNote}` : "");
        return { items: keepAwaiting(pool, total), message, radius: miles, expanded: widened || approximate };
      }
    }
  }

  // Level 5: nearest major metro, named explicitly.
  const metro = geo ? geo.nearestMetro(from) : null;
  if (metro) {
    const metroHits = placed.filter((item) => {
      const point = listingPoint(item);
      return point && geo.milesBetween({ lat: metro.lat, lon: metro.lon }, point) <= 40;
    });
    const total = new Set([...within(100), ...metroHits, ...remotes, ...unplaceable]);
    if (total.size) {
      return {
        items: keepAwaiting(pool, total),
        message: `Nothing within 100 miles of ${label}. Showing roles around ${metro.label}, the nearest major hiring metro (${Math.round(metro.miles)} miles away)${remotes.length ? `, plus ${remotes.length} remote` : ""}.`,
        radius: null, expanded: true,
      };
    }
  }

  // Level 6: remote only.
  if (remotes.length) {
    return {
      items: keepAwaiting(pool, new Set([...remotes, ...unplaceable])),
      message: `No roles near ${label} right now, so we're showing ${remotes.length} remote internship${remotes.length === 1 ? "" : "s"} you can do from anywhere.`,
      radius: null, expanded: true,
    };
  }

  // Level 7: everything, clearly marked as requiring a move. Shown rather than
  // an empty screen, but never silently.
  return {
    items: pool,
    message: `Nothing within range of ${label}, and no remote roles open. These would all mean relocating — tick “Willing to relocate” in your profile to make this your normal view.`,
    radius: null, expanded: true, beyondRange: true,
  };
}

// Placeholders and watch-list cards aren't location-bound; they should survive
// whatever the radius logic decides about real listings.
function keepAwaiting(pool, allowed) {
  return pool.filter((item) => isAwaitingLike(item) || allowed.has(item));
}

// Cached per render so a list of 200 rows doesn't re-run the whole expansion.
let lastLocationResult = null;
function currentLocationResult() {
  return lastLocationResult || (lastLocationResult = locationSearch(openings));
}
function invalidateLocationSearch() {
  lastLocationResult = null;
  locationCache = { text: null, value: null };
}

function locationPreferenceMatch(item) {
  const listingLocation = String(item.location || "").toLowerCase();
  const preferred = String(profile.preferredLocation || "").toLowerCase().trim();
  if (!listingLocation) return { score: 0, reason: "" };
  if (profile.remoteOkay && (item.remote || listingLocation.includes("remote"))) return { score: 14, reason: "Remote" };
  if (!preferred || preferred === "no preference") return { score: 0, reason: "" };

  const tokens = preferred.split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  if (tokens.some((token) => listingLocation.includes(token))) return { score: 14, reason: profile.preferredLocation };
  if (profile.willingToRelocate) return { score: 3, reason: "Relocation" };
  return { score: -8, reason: "" };
}

function openingMatch(item) {
  const text = profileMatchText();
  const searchable = [item.company, item.role, item.field, item.program].join(" ").toLowerCase();
  const reasons = [];
  let score = 42;

  if (profile.fields.includes(item.field)) {
    score += 28;
    reasons.push(item.field);
  }

  if (text && text.includes(item.company.toLowerCase().split(" ")[0])) {
    score += 24;
    reasons.push(item.company);
  }

  const roleWords = item.role.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
  const roleHits = roleWords.filter((word) => text.includes(word));
  if (roleHits.length) {
    score += Math.min(roleHits.length * 10, 22);
    reasons.push(roleHits[0]);
  }

  const fieldHits = (interestKeywords[item.field] || []).filter((keyword) => keywordInText(keyword, text));
  if (fieldHits.length) {
    score += Math.min(fieldHits.length * 6, 20);
    if (!reasons.includes(item.field)) reasons.push(item.field);
  }

  if (profile.major && searchable.includes(profile.major.toLowerCase().split(" ")[0])) score += 6;
  // Cycle fit: a role in the student's own recruiting cycle rises to the top.
  if (profile.gradYear && item.cycle && cycleMatchesProfile(item)) {
    score += 26;
    reasons.push(item.cycle);
  }
  const locationMatch = locationPreferenceMatch(item);
  score += locationMatch.score;
  if (locationMatch.reason) reasons.push(locationMatch.reason);
  score = Math.max(20, Math.min(score, 98));

  const reasonText = reasons.length ? reasons.slice(0, 2).join(" + ") : "broad profile";
  // Honest labelling: this is a transparent keyword/cycle rules score, not a
  // machine-learned model — so we show a plain tier and the reason it matched,
  // never an "AI match %" that implies precision we can't back up.
  const tier = score >= 85 ? "Strong match" : score >= 65 ? "Good match" : "Possible match";
  return { score, reasonText, tier, label: `${tier} · ${reasonText}` };
}

function topFields() {
  if (profile.fields.length) return profile.fields.slice(0, 3);
  return [...new Set(preferredOpenings().map((item) => item.field))].slice(0, 3);
}

function nextWindowText() {
  const fields = topFields();
  const first = fields[0] || "student";
  const second = fields[1] || "early-career";
  return {
    title: `${first} and ${second} alerts are the next watchlist.`,
    copy: `${profile.gradYear ? `Class of ${profile.gradYear}` : "Student"} recruiting for ${first.toLowerCase()} roles is most active from July through October 2026.`,
  };
}

function updateAlertIntelligence() {
  const fields = topFields();
  const major = profile.major || "your major";
  const school = profile.school || "your school";
  const fieldText = fields.length ? fields.join(", ") : "every field";
  const next = nextWindowText();

  document.querySelector("[data-alert-profile]").textContent = `Tracking ${fieldText} for ${major}.`;
  // Alert Profile copy line was removed from the dashboard; guard for cached shells.
  const profileCopy = document.querySelector("[data-alert-profile-copy]");
  if (profileCopy) profileCopy.textContent = `${school} context, ${profile.gradYear ? `Class of ${profile.gradYear}` : "class year"}, and your interests decide which alerts rise first.`;
  // Next-window elements were merged into the Alert Pulse box; guard in case
  // a cached shell still has them.
  const nextWindow = document.querySelector("[data-next-window]");
  if (nextWindow) nextWindow.textContent = next.title;
  const nextWindowCopy = document.querySelector("[data-next-window-copy]");
  if (nextWindowCopy) nextWindowCopy.textContent = next.copy;
  updateAlertPulse();
}

const seenAlertsStorageKey = "promptlySeenAlerts";

function alertIdentity(item) {
  return window.PromptlyListingState.listingIdentity(item);
}

function isWatchedCompany(item) {
  const company = String(item.company || "").trim().toLowerCase();
  return Boolean(company) && watchList().some((w) => String(w.company || "").trim().toLowerCase() === company);
}

function matchingLiveOpenings() {
  return preferredOpenings().filter((item) => {
    if (isAwaitingLike(item)) return false;
    // A company the student explicitly watches always shows in their feed,
    // regardless of field filters — mirrors the server-side alert rule.
    if (isWatchedCompany(item)) return true;
    return !profile.fields.length || profile.fields.includes(item.field);
  });
}

function readSeenAlerts() {
  try {
    const value = JSON.parse(localStorage.getItem(seenAlertsStorageKey) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

// Show the student's most recent alert-worthy openings inside the pulse box:
// newest matches first (unseen ones lead), capped at 3 lines.
function renderPulseRecent(matches, unseen) {
  const list = document.querySelector("[data-pulse-recent]");
  if (!list) return;
  const pool = [...(unseen || []), ...matches.filter((m) => !(unseen || []).includes(m))];
  const items = pool.filter((o) => !isAwaitingLike(o)).slice(0, 3);
  list.hidden = !items.length;
  list.innerHTML = items.map((o) => `<li><strong>${esc(o.company)}</strong><span>${esc(o.role)}</span></li>`).join("");
}

function updateAlertPulse() {
  const title = document.querySelector("[data-return-pulse]");
  const copy = document.querySelector("[data-return-pulse-copy]");
  if (!title || !copy) return;

  const matches = matchingLiveOpenings();
  const stored = localStorage.getItem(seenAlertsStorageKey);
  if (!stored) {
    localStorage.setItem(seenAlertsStorageKey, JSON.stringify(matches.map(alertIdentity)));
    title.textContent = "Your watchlist is active.";
    copy.textContent = `${matches.length} verified matches fit your current alert profile. New postings will appear here first.`;
    renderPulseRecent(matches, []);
    return;
  }

  const seen = readSeenAlerts();
  const unseen = matches.filter((item) => !seen.has(alertIdentity(item)));
  title.textContent = unseen.length
    ? `${unseen.length} new ${unseen.length === 1 ? "match" : "matches"} since your last review.`
    : "You're all caught up!";
  copy.textContent = unseen.length
    ? `Open Live Openings to review what changed across ${topFields().join(", ") || "your fields"}.`
    : `Promptly is monitoring ${matches.length} verified matches for your profile.`;
  renderPulseRecent(matches, unseen);
}

function markMatchingAlertsSeen() {
  const seen = readSeenAlerts();
  matchingLiveOpenings().forEach((item) => seen.add(alertIdentity(item)));
  localStorage.setItem(seenAlertsStorageKey, JSON.stringify([...seen].slice(-500)));
  updateAlertPulse();
  updateAlertBadge();
}

// Cap how many rows render at once. 200+ image rows crashes mobile Safari
// (out of memory). Show a hint to narrow with tabs/search for the rest.
const MAX_ROWS = 60;
function renderRows(list) {
  if (!list.length) {
    return `<p class="list-note" style="text-align:center;padding:36px 16px;color:var(--muted)">No openings match this yet. Try another company or field — Promptly adds new ones every day.</p>`;
  }
  let html = list.slice(0, MAX_ROWS).map(openingRow).join("");
  if (list.length > MAX_ROWS) {
    html += `<p class="list-note">Showing ${MAX_ROWS} of ${list.length}. Use the tabs or search to find a specific company.</p>`;
  }
  return html;
}

// The explanation banner for whatever the radius logic had to do. Section 3's
// rule: never silently return jobs hundreds of miles away.
function locationNoticeHtml() {
  const result = currentLocationResult();
  if (!result.message) return "";
  return `<p class="location-notice${result.beyondRange ? " beyond" : ""}">${esc(result.message)}</p>`;
}

function renderOpenings(items = preferredOpenings()) {
  const notice = locationNoticeHtml();
  const compact = items.slice(0, 5).map(openingRow).join("");
  const full = renderRows(items);
  const empty = `<p class="empty-hint">No openings match this profile yet. Widen your fields or turn on <b>Willing to relocate</b> to see more.</p>`;
  document.querySelector(".compact-list").innerHTML = notice + (compact || empty);
  document.querySelector(".full-list").innerHTML = notice + (full || empty);
}

function setFeatured() {
  // "Just opened" is a claim about a real posting we saw appear. Only a
  // verified live listing can carry it — never a placeholder or a careers-page
  // link, which previously headlined the home screen as if it were breaking news.
  const ranked = preferredOpenings();
  const item = ranked.find((entry) => listingStatus(entry) === "OPEN") || ranked[0];
  if (!item) return;
  const listingKey = alertIdentity(item);
  const isSaved = saved.has(listingKey);
  const status = listingStatus(item);
  const title = document.querySelector("[data-feature-title]");
  const copy = document.querySelector("[data-feature-copy]");

  if (status === "OPEN") {
    title.textContent = `${item.company} ${item.role} just opened.`;
    copy.textContent = `${item.field} student alert · ${item.location ? `${item.location} · ` : ""}Deadline ${item.deadline}. ${item.opened}.`;
  } else if (status === "BROWSE") {
    title.textContent = `${item.company} is on Promptly's watch list.`;
    copy.textContent = `${item.field} student alert · ${item.company} doesn't publish a feed we can read, so we link their official careers search instead of claiming a posting.`;
  } else {
    title.textContent = `${item.company} — awaiting the ${item.program} posting.`;
    copy.textContent = `${item.field} student alert · Promptly is watching and will alert you the moment it opens.`;
  }
  const featureLogo = document.querySelector("[data-feature-logo]");
  const featureLogoUrl = companyLogoUrl(item);
  featureLogo.className = `mega-logo ${featureLogoUrl ? "logo-tile" : item.logoClass}`;
  featureLogo.innerHTML = featureLogoUrl
    ? `<img src="${esc(featureLogoUrl)}" alt="${esc(item.company)} logo" data-short="${esc(item.short || "")}" data-lc="${esc(item.logoClass || "")}" data-logo-img />`
    : esc(item.short);
  document.querySelector("[data-feature-details]").dataset.openDetails = listingKey;
  document.querySelector("[data-feature-save]").dataset.save = listingKey;
  document.querySelector("[data-feature-save]").textContent = isSaved ? "Unsave Alert" : "Save Alert";
}

// On a phone the action buttons leave ~165px for the title, but "Student
// Alert Feed" needs ~194px, so it wrapped to two lines while every other view
// fit on one — the header looked lopsided view to view. Shrinking the type
// enough to fit would push it under 18px, too small for a heading, so drop the
// "Student " prefix instead: the app is only for students and the nav bar
// already names the section, making the word pure redundancy on a small
// screen. Desktop keeps the full heading.
function viewHeading(view) {
  const full = view.dataset.heading || "";
  return isMobileDevice() ? full.replace(/^Student\s+/, "") : full;
}

function setView(name) {
  const view = document.querySelector(`#view-${name}`);
  if (!view) return;

  views.forEach((item) => item.classList.toggle("active", item === view));
  // (heading chosen below — see viewHeading)
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  title.textContent = name === "home" ? greetingText() : viewHeading(view);
  window.scrollTo({ top: 0, behavior: "smooth" });

  renderVerificationNotice();
  if (name === "openings") markMatchingAlertsSeen();
  if (name === "cycles") renderCyclesView();

  if (name === "alerts") {
    const list = document.querySelector(".alerts-recent-list");
    if (list) {
      const recent = recentOpenings();
      list.innerHTML = recent.length
        ? recent.map(openingRow).join("")
        : "<p style='color:var(--muted);padding:16px 0'>No new openings in the last 7 days.</p>";
    }
  }
}

// Data-driven Cycles view: replaces the old hardcoded 3-industry timeline.
// Groups the student's real (verified, non-awaiting) openings by recruiting
// cycle, the student's own cycles first, so a senior sees New Grad roles and
// a sophomore sees Summer 2027/2028 — driven entirely by live data.
// Sort key for a cycle label: earlier year first, seasons in calendar order,
// undated buckets last. Works for any "<Season> <Year>" / "New Grad <Year>".
const SEASON_RANK = { spring: 1, summer: 2, fall: 3, winter: 4 };
function cycleSortKey(cycle) {
  const yearMatch = String(cycle).match(/20\d\d/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : 9999;
  const seasonMatch = String(cycle).toLowerCase().match(/spring|summer|fall|winter/);
  const season = seasonMatch ? SEASON_RANK[seasonMatch[0]] : (/new grad/i.test(cycle) ? 6 : 5);
  return year * 10 + season;
}
// ── Recruiting timeline ───────────────────────────────────────────────────
// A month grid of which employers post student roles when, grouped by
// industry and filterable by track / industry / cycle.
//
// IMPORTANT: every dot here is a month Promptly OBSERVED a posting go live
// (opening.firstSeen, stamped by the refresh cron). It is not a predicted
// recruiting window. The previous version of this screen hard-coded positions
// like "Goldman at month 8.5", which asserted recruiting dates nobody had
// checked — the same fabrication problem as the old Google card. Observed data
// is both defensible and a stronger claim, because no one else has it.

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// A rolling window ending this month. A full calendar year would be mostly
// empty columns — first-seen dates only exist for as long as the pipeline has
// been running, so twelve columns read as "broken" rather than "new".
const TIMELINE_MONTHS = 6;

const cycleFilters = { track: "", industry: "", season: "" };

// How far the 6-month window is shifted from "ending this month", in months.
// Positive = into the future (estimates), negative = into the past.
// Clamped so the window END never goes past +12 months (1 year of estimates)
// and the window START never goes before -36 months (3 years of history).
let cycleWindowOffset = 0;
const CYCLE_OFFSET_MAX = 12;                          // window end up to +1yr
const CYCLE_OFFSET_MIN = -(36 - (TIMELINE_MONTHS - 1)); // window start back to -3yr

function clampCycleOffset(value) {
  return Math.max(CYCLE_OFFSET_MIN, Math.min(CYCLE_OFFSET_MAX, value));
}

// The columns to draw, oldest first, as {year, month, label, future}.
function timelineColumns(now = new Date()) {
  const columns = [];
  const endMonthIndex = now.getUTCMonth() + cycleWindowOffset;
  const nowKey = now.getUTCFullYear() * 12 + now.getUTCMonth();
  for (let back = TIMELINE_MONTHS - 1; back >= 0; back -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), endMonthIndex - back, 1));
    const key = date.getUTCFullYear() * 12 + date.getUTCMonth();
    columns.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth(),
      label: MONTH_LABELS[date.getUTCMonth()],
      future: key > nowKey,
    });
  }
  return columns;
}

// Year AND month. Returning just the month meant a posting first seen in
// August 2025 landed in the August 2026 column — wrong, and increasingly wrong
// the longer the pipeline runs.
function observedPoint(item) {
  if (!item.firstSeen) return null;
  const time = Date.parse(item.firstSeen);
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

function inColumn(item, column) {
  const point = observedPoint(item);
  return Boolean(point && point.year === column.year && point.month === column.month);
}

// Curated industry (division) list per track. Selecting a track shows exactly
// this set — never another track's industries — so the taxonomy reads clean and
// familiar (Finance → IB, S&T, AM, WM, PE, Quant…) instead of whatever raw
// labels happen to be in the data.
const TRACK_DIVISIONS = {
  Finance: ["Investment Banking", "Sales & Trading", "Asset Management", "Wealth Management", "Private Equity", "Hedge Fund", "Quant Trading", "Corporate & Commercial Banking", "Fintech", "Payments"],
  Technology: ["Software Engineering", "AI / ML", "Data", "Security", "Semiconductors", "Enterprise Software", "Gaming", "Cloud & Infrastructure"],
  Healthcare: ["Biotech", "Pharma", "Medical Devices", "Payers", "Health Systems", "Health Technology"],
  Consulting: ["Strategy", "Management Consulting", "Technology Consulting", "Economic Consulting"],
  Media: ["Streaming", "Entertainment", "News", "Publishing", "Digital Media", "Sports Media"],
  Consumer: ["Consumer Packaged Goods", "Retail", "Food & Beverage", "Apparel", "Beauty", "Fitness"],
  Engineering: ["Aerospace & Defense", "Automotive", "Robotics", "Energy", "Manufacturing", "Semiconductors"],
  Law: ["Big Law", "Legal Technology"],
  "Real Estate": ["Commercial Real Estate", "Property Technology"],
  Marketing: ["Brand Marketing", "Growth", "Advertising", "Communications"],
};
// Raw registry subField values that don't match a division label 1:1.
const DIVISION_ALIASES = {
  "Banking": "Corporate & Commercial Banking",
  "AI": "AI / ML",
  "Data & ML": "AI / ML",
  "Aerospace": "Aerospace & Defense",
  "CPG": "Consumer Packaged Goods",
  "Health Tech": "Health Technology",
  "AdTech": "Advertising",
  "News": "News",
};
// The curated division an item belongs to (independent of raw label variants).
function divisionOf(item) {
  const raw = String(item.subField || "").trim();
  if (!raw) return "";
  return DIVISION_ALIASES[raw] || raw;
}

// Rows are the broad track by default, so the overview stays readable. Drilling
// into a single track switches to its curated divisions.
function timelineRowKey(item) {
  if (cycleFilters.track) return divisionOf(item) || "Other";
  return item.field || "Other";
}

function timelinePool() {
  return openings.filter((item) => !isAwaitingLike(item) && listingStatus(item) === "OPEN");
}

function fillSelect(selector, values, current) {
  const select = document.querySelector(selector);
  if (!select) return;
  const first = select.querySelector("option");
  select.innerHTML = "";
  select.appendChild(first);
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (value === current) option.selected = true;
    select.appendChild(option);
  });
}

function renderCyclesView() {
  const grid = document.querySelector("[data-cycle-grid]");
  if (!grid) return;
  const pool = timelinePool();

  // Populate the filter menus from what actually exists, so a student can
  // never select a combination that returns nothing.
  fillSelect("[data-cycle-track]", [...new Set(pool.map((o) => o.field).filter(Boolean))].sort(), cycleFilters.track);
  // Industries are the selected track's curated divisions. With no track chosen,
  // fall back to whatever divisions exist across everything.
  const industryOptions = cycleFilters.track
    ? (TRACK_DIVISIONS[cycleFilters.track] || [...new Set(pool.filter((o) => o.field === cycleFilters.track).map(divisionOf).filter(Boolean))].sort())
    : [...new Set(pool.map(divisionOf).filter(Boolean))].sort();
  fillSelect("[data-cycle-industry]", industryOptions, cycleFilters.industry);
  // Drop the undated generic cycles ("Internship" / "New Grad") — this is an
  // internship platform, so a bare "Internship" tag is noise; keep only the
  // dated seasons (Summer 2027, Fall 2026, New Grad 2027…).
  fillSelect("[data-cycle-season]", [...new Set(pool.map((o) => o.cycle).filter(Boolean))]
    .filter((c) => /20\d\d/.test(c))
    .sort((a, b) => cycleSortKey(a) - cycleSortKey(b)), cycleFilters.season);

  const filtered = pool.filter((item) =>
    (!cycleFilters.track || item.field === cycleFilters.track) &&
    (!cycleFilters.industry || divisionOf(item) === cycleFilters.industry) &&
    (!cycleFilters.season || item.cycle === cycleFilters.season)
  );

  renderCycleChips();

  const columns = timelineColumns();
  updateCycleWindowLabel(columns);
  const dated = filtered.filter((item) => columns.some((column) => inColumn(item, column)));
  const undated = filtered.length - dated.length;

  // Headline counts, computed — never asserted.
  const summary = document.querySelector("[data-cycle-summary]");
  if (summary) {
    const employers = new Set(filtered.map((o) => o.company)).size;
    const mine = filtered.filter((o) => cycleMatchesProfile(o)).length;
    summary.innerHTML = `
      <article><strong>${filtered.length}</strong><p>live student roles${cycleFilters.track ? ` in ${esc(cycleFilters.track)}` : ""}</p></article>
      <article><strong>${employers}</strong><p>employers posting</p></article>
      <article><strong>${mine}</strong><p>match your class year</p></article>`;
  }

  const subnote = document.querySelector("[data-cycle-subnote]");
  if (subnote) {
    const labels = relevantCycleLabels(profile.gradYear);
    subnote.textContent = labels
      ? `Highlighted markers are cycles especially relevant to ${profile.gradYear ? `the class of ${profile.gradYear}` : "your profile"}.`
      : "";
  }

  // Rows come from the full filtered set (not just in-window observations) so a
  // company observed in a prior year is available as a future ESTIMATE.
  const rows = {};
  filtered.forEach((item) => {
    if (!observedPoint(item)) return;
    const key = timelineRowKey(item);
    (rows[key] = rows[key] || []).push(item);
  });

  const now = new Date();
  const isCurrent = (column) => column.year === now.getUTCFullYear() && column.month === now.getUTCMonth();

  // What belongs in one cell. Past/current months show what Promptly actually
  // observed that month. Future months show ESTIMATES: companies seen in the
  // same calendar month in an earlier year (one marker per company).
  function cellItems(rowItems, column) {
    const seen = new Set();
    const out = [];
    for (const item of rowItems) {
      const point = observedPoint(item);
      if (!point) continue;
      const hit = column.future
        ? point.month === column.month && point.year < column.year
        : point.year === column.year && point.month === column.month;
      if (!hit || seen.has(item.company)) continue;
      seen.add(item.company);
      out.push(item);
    }
    return out;
  }

  const header = `<div class="cycle-row cycle-head" role="row">
      <div class="cycle-row-label" role="columnheader"><span class="cycle-corner">Industry</span></div>
      ${columns.map((column) => `<button type="button" class="cycle-month${isCurrent(column) ? " is-now" : ""}${column.future ? " is-future" : ""}" role="columnheader" data-cycle-month data-col-year="${column.year}" data-col-month="${column.month}" title="Double-click to see every company this month">${column.label}${isCurrent(column) ? `<span class="cycle-now-tag">now</span>` : column.future ? `<span class="cycle-est-tag">est.</span>` : ""}</button>`).join("")}
    </div>`;

  // Only rows with at least one marker somewhere in the window, busiest first.
  const activeRows = Object.keys(rows).filter((label) => columns.some((column) => cellItems(rows[label], column).length));
  if (!activeRows.length) {
    grid.innerHTML = `<p class="empty-hint">Nothing to show in this window for these filters. Use the arrows to move to a month with observed postings, or look ahead to estimated drop windows.</p>`;
    renderCycleFootnote(undated);
    return;
  }
  const ordered = activeRows.sort((a, b) => rows[b].length - rows[a].length || a.localeCompare(b));
  const MAX_VISIBLE = 3;

  const body = ordered.map((label) => {
    const cells = columns.map((column) => {
      const here = cellItems(rows[label], column);
      const visible = here.slice(0, MAX_VISIBLE);
      const hidden = here.slice(MAX_VISIBLE);
      const markers = visible.map((item) => companyMarker(item, column)).join("");
      const more = hidden.length
        ? `<button type="button" class="cycle-more" data-cycle-more aria-expanded="false" aria-label="Show ${hidden.length} more employers">+${hidden.length}</button>
           <div class="cycle-popover" data-cycle-popover hidden>${hidden.map((item) => companyMarker(item, column, true)).join("")}</div>`
        : "";
      return `<div class="cycle-cell${isCurrent(column) ? " is-now" : ""}${column.future ? " is-future" : ""}" role="gridcell">${markers}${more}</div>`;
    }).join("");
    const count = new Set(columns.flatMap((column) => cellItems(rows[label], column).map((i) => i.company))).size;
    return `<div class="cycle-row" role="row">
        <div class="cycle-row-label" role="rowheader"><b>${esc(label)}</b><span>${count} employer${count === 1 ? "" : "s"}</span></div>
        ${cells}
      </div>`;
  }).join("");

  grid.innerHTML = `<div class="cycle-scroll"><div class="cycle-table" role="grid" style="--cycle-cols:${columns.length}">${header}${body}</div></div>`;
  renderCycleFootnote(undated);
}

// One company marker. Initials render UNDER the logo so a missing or broken
// image degrades to a monogram rather than a broken-image icon.
function companyMarker(item, column, inPopover = false) {
  const logo = companyLogoUrl(item);
  const mine = cycleMatchesProfile(item) ? " is-mine" : "";
  const est = column.future ? " is-estimate" : "";
  const when = column.future ? `Estimated: ${column.label} ${column.year}` : `Observed: ${column.label} ${column.year}`;
  const fn = roleFunction(item.role);
  const initials = esc(String(item.short || item.company.replace(/[^A-Za-z]/g, "").slice(0, 2)).toUpperCase().slice(0, 3));
  // Trey's estimate/function tooltip, keyed by Cam's per-listing identity —
  // this branch predates that fix and would otherwise re-key the marker back
  // to company name, reviving the "one role marks them all" bug.
  const tip = [item.company, when, [item.field, item.subField].filter(Boolean).join(" · "), fn, item.cycle || "", item.role || ""].filter(Boolean);
  return `<button class="cycle-marker${mine}${est}${inPopover ? " in-popover" : ""}" data-open-details="${esc(alertIdentity(item))}"${column.future ? ` data-estimate="${esc(column.label)} ${column.year}"` : ""} aria-label="${esc(tip.join(", "))}">
      <span class="cycle-initials" aria-hidden="true">${initials}</span>
      ${logo ? `<img src="${esc(logo)}" alt="" loading="lazy" data-short="${initials}" data-lc="${esc(item.logoClass || "")}" data-logo-img />` : ""}
      <span class="cycle-tip" role="tooltip">
        <b>${esc(item.company)}</b>
        <i>${esc(when)}</i>
        ${item.field ? `<i>${esc([item.field, item.subField].filter(Boolean).join(" · "))}</i>` : ""}
        ${fn ? `<i>Function: ${esc(fn)}</i>` : ""}
        ${item.cycle ? `<i>${esc(item.cycle)}</i>` : ""}
        ${item.role ? `<i>${esc(item.role)}</i>` : ""}
      </span>
    </button>`;
}

// Role FUNCTION from the title, independent of the employer's industry — so an
// "Operations Intern" at a hedge fund reads as Operations, not Finance. Used in
// tooltips and the month drill-down. Returns "" when nothing clearly matches.
const ROLE_FUNCTIONS = [
  ["Software Engineering", /software|\bswe\b|full[- ]?stack|backend|front[- ]?end|developer|programming/i],
  ["Data & ML", /data scien|machine learning|\bml\b|\bai\b|analytics|data engineer|quantitative research/i],
  ["Quant / Trading", /quant|trader|trading|market maker/i],
  ["Operations", /operations|\bops\b|supply chain|logistics|program management/i],
  ["Finance & Accounting", /accounting|financial analyst|corporate finance|treasury|\bfp&a\b|audit|tax/i],
  ["Investment / Banking", /investment bank|\bib\b|sales (&|and) trading|\bs&t\b|private equity|asset management|wealth/i],
  ["Product", /product manager|product management|\bpm\b intern|product design/i],
  ["Design", /\bdesign|\bux\b|\bui\b|creative/i],
  ["Marketing", /marketing|brand|growth|social media|communications|\bpr\b/i],
  ["Sales", /\bsales\b|business development|account executive|partnerships/i],
  ["Engineering (Hardware)", /mechanical|electrical|hardware|manufacturing|aerospace engineer|civil/i],
  ["Legal", /legal|counsel|paralegal|compliance/i],
  ["HR / People", /human resources|\bhr\b|people team|recruit|talent/i],
  ["Research", /research|scientist|\br&d\b|clinical/i],
];
function roleFunction(role) {
  const text = String(role || "");
  for (const [name, re] of ROLE_FUNCTIONS) if (re.test(text)) return name;
  return "";
}

// Active filters as removable chips, so what is applied is always visible.
function renderCycleChips() {
  const wrap = document.querySelector("[data-cycle-chips]");
  const clear = document.querySelector("[data-cycle-reset]");
  if (!wrap) return;
  const active = [
    cycleFilters.track ? { key: "track", label: cycleFilters.track } : null,
    cycleFilters.industry ? { key: "industry", label: cycleFilters.industry } : null,
    cycleFilters.season ? { key: "season", label: cycleFilters.season } : null,
  ].filter(Boolean);

  if (clear) clear.hidden = !active.length;
  wrap.hidden = !active.length;
  wrap.innerHTML = active.map((chip) =>
    `<button type="button" class="cycle-chip" data-cycle-remove="${esc(chip.key)}">${esc(chip.label)}<span aria-hidden="true">×</span><span class="sr-only">Remove filter</span></button>`
  ).join("");
}

function renderCycleFootnote(undated) {
  const unknown = document.querySelector("[data-cycle-unknown]");
  if (!unknown) return;
  unknown.hidden = false;
  // Methodology (observed vs estimated) lives in the "How this works" box up
  // top — keep this line to a plain window summary.
  unknown.textContent = undated
    ? `${undated} more live role${undated === 1 ? " was" : "s were"} first seen outside this window.`
    : "Double-click a month to see every company that month.";
}

// The "« ‹ Mar–Aug 2026 › »" label + arrow enable/disable state.
function updateCycleWindowLabel(columns) {
  const label = document.querySelector("[data-cycle-window-label]");
  if (label && columns.length) {
    const a = columns[0];
    const b = columns[columns.length - 1];
    // Just the year — "2026" — or "2026–27" when the window straddles two.
    label.textContent = a.year === b.year ? `${b.year}` : `${a.year}–${String(b.year).slice(2)}`;
  }
  document.querySelectorAll("[data-cycle-nav]").forEach((btn) => {
    const step = Number(btn.dataset.cycleNav);
    btn.disabled = clampCycleOffset(cycleWindowOffset + step) === cycleWindowOffset;
  });
}

function resolveOpening(reference) {
  return window.PromptlyListingState.resolveListing(openings, reference);
}

function findOpening(reference) {
  return resolveOpening(reference) || preferredOpenings()[0];
}

// Takes a listing reference (Cam's per-listing identity), not a company name.
// estimateWhen is Trey's future-column marker: an estimate is not a live req,
// so the modal has to say so.
function openDetails(reference, estimateWhen = "") {
  const item = findOpening(reference);
  if (!item) return;
  track("opening_view");
  const match = openingMatch(item);
  modal.dataset.company = item.company;
  modal.dataset.listingId = alertIdentity(item);
  modalCompany.textContent = item.company;
  // Don't name a specific req for an employer whose feed we can't read.
  modal.querySelector("[data-modal-role]").textContent = listingStatus(item) === "BROWSE"
    ? `Internship roles · ${item.program}`
    : `${item.role} · ${item.program}`;
  // An ESTIMATE (future month) is not a live posting — say so plainly rather
  // than showing it like an open req. The general "how this works" note carries
  // the methodology; this just states the status for this one marker.
  if (estimateWhen) {
    modal.querySelector("[data-modal-why]").textContent = `Not open yet — estimated to drop around ${estimateWhen}, based on when ${item.company} posted in previous years.`;
    modal.querySelector("[data-modal-deadline]").textContent = "Not open yet";
    const statusEl0 = modal.querySelector("[data-modal-status]");
    if (statusEl0) { statusEl0.textContent = "NOT OPEN YET"; statusEl0.className = "status-pill pill-browse"; }
    modal.querySelector("[data-modal-opened]").textContent = `Est. ${estimateWhen}`;
    modal.querySelector("[data-modal-location]").textContent = item.location || "See posting";
    modal.querySelector("[data-modal-field]").textContent = item.field;
    const estLogo = modal.querySelector(".modal-logo");
    const estLogoUrl = companyLogoUrl(item);
    estLogo.className = `modal-logo ${estLogoUrl ? "logo-tile" : item.logoClass}`;
    estLogo.innerHTML = estLogoUrl
      ? `<img src="${esc(estLogoUrl)}" alt="${esc(item.company)} logo" data-short="${esc(item.short || "")}" data-lc="${esc(item.logoClass || "")}" data-logo-img />`
      : esc(item.short || item.company.slice(0, 3).toUpperCase());
    if (typeof modal.showModal === "function" && !modal.open) modal.showModal();
    return;
  }
  modal.querySelector("[data-modal-why]").textContent = `Why this alert: ${match.reasonText === "broad profile" ? "It fits your broader student alert profile." : `Matched ${match.reasonText} from your profile.`}`;
  modal.querySelector("[data-modal-deadline]").textContent = item.deadline;
  const statusEl = modal.querySelector("[data-modal-status]");
  if (statusEl) {
    const st = listingStatus(item);
    statusEl.textContent = st;
    statusEl.className = `status-pill${st === "OPEN" ? "" : ` pill-${st.toLowerCase()}`}`;
  }
  // "Opened recently" is a curated string, not something we observed — don't
  // assert it for an employer we can't actually read.
  modal.querySelector("[data-modal-opened]").textContent = listingStatus(item) === "BROWSE"
    ? "Not confirmed"
    : item.opened.replace("Opened ", "");
  modal.querySelector("[data-modal-location]").textContent = item.location || "See posting";
  modal.querySelector("[data-modal-field]").textContent = item.field;
  // Verification freshness. lastVerified is the timestamp of the most recent
  // refresh that still found this posting in the employer's own feed — the
  // strongest claim the product can make, so show it rather than leave it in
  // the data. Absent on curated/browse cards, which were never feed-verified.
  const sourceCell = modal.querySelector("[data-modal-source]");
  if (sourceCell) {
    const base = item.sourceLabel || "Official source";
    const checked = item.lastVerified ? relativeTime(item.lastVerified) : "";
    sourceCell.textContent = checked ? `${base} · confirmed live ${checked}` : base;
  }
  const sourceLink = modal.querySelector("[data-modal-source-link]");
  const status = listingStatus(item);
  // Show the link when there's a real destination: an OPEN posting, or an
  // UPCOMING program whose page is already live (e.g. Goldman's 2027 program).
  // Hide only for AWAITING placeholders (no real URL) and CLOSED (dead links).
  // BROWSE included: the careers search page is a real, working destination —
  // it just isn't a specific verified req, which the labelling now says.
  const showLink = Boolean(item.sourceUrl) && (status === "OPEN" || status === "UPCOMING" || status === "BROWSE");
  // sourceUrl arrives from an external employer feed, so never trust its scheme.
  // The email and push paths already validate; the in-app link must too.
  sourceLink.href = safeHttpsUrl(status === "BROWSE" ? browseUrlFor(item) : item.sourceUrl) || "#";
  sourceLink.hidden = !showLink;
  // Honest labeling: verified deep link vs. "browse", vs. a not-yet-open program page.
  sourceLink.textContent = status === "UPCOMING"
    ? "View the Program Page"
    : item.browse ? `Browse ${item.company} Careers` : "Open Official Posting";
  modal.querySelector("[data-save-modal]").textContent = saved.has(alertIdentity(item)) ? "Unsave Alert" : "Save Alert";
  const modalLogo = modal.querySelector(".modal-logo");
  const modalLogoUrl = companyLogoUrl(item);
  modalLogo.className = `modal-logo ${modalLogoUrl ? "logo-tile" : item.logoClass}`;
  modalLogo.innerHTML = modalLogoUrl
    ? `<img src="${esc(modalLogoUrl)}" alt="${esc(item.company)} logo" data-short="${esc(item.short || "")}" data-lc="${esc(item.logoClass || "")}" data-logo-img />`
    : esc(item.short);
  renderStatusTracker(item);
  resetReportForm();
  if (typeof modal.showModal === "function") modal.showModal();
}

// ── Report a bad listing ──────────────────────────────────────────────────
// At this many monitored employers nobody can hand-verify every posting, and
// the student who just clicked a dead link is the fastest signal we have.
// Collapsed by default and reset per open, so a previous report's state never
// bleeds onto a different company.
function resetReportForm() {
  const form = document.querySelector("[data-report-form]");
  const toggle = document.querySelector("[data-report-toggle]");
  if (!form || !toggle) return;
  form.hidden = true;
  toggle.hidden = false;
  toggle.textContent = "Something wrong with this listing?";
  const note = form.querySelector("[data-report-note]");
  const reason = form.querySelector("[data-report-reason]");
  const status = form.querySelector("[data-report-status]");
  const submit = form.querySelector(".report-submit");
  if (note) note.value = "";
  if (reason) reason.selectedIndex = 0;
  if (status) { status.textContent = ""; status.className = "report-status"; }
  if (submit) { submit.disabled = false; submit.textContent = "Send report"; }
}

document.addEventListener("click", (event) => {
  if (!event.target.closest("[data-report-toggle]")) return;
  const form = document.querySelector("[data-report-form]");
  const toggle = document.querySelector("[data-report-toggle]");
  if (!form || !toggle) return;
  form.hidden = false;
  toggle.hidden = true;
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-report-form]");
  if (!form) return;
  event.preventDefault();

  const listingId = modal.dataset.listingId;
  const item = listingId ? resolveOpening(listingId) : null;
  if (!item) return;

  const status = form.querySelector("[data-report-status]");
  const submit = form.querySelector(".report-submit");
  submit.disabled = true;
  submit.textContent = "Sending…";
  status.className = "report-status";
  status.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "report",
        company: item.company,
        role: item.role || "",
        location: item.location || "",
        url: item.sourceUrl || "",
        reason: form.querySelector("[data-report-reason]").value,
        note: form.querySelector("[data-report-note]").value,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not send that.");
    status.className = "report-status ok";
    status.textContent = data.emailSent
      ? "Thanks — your report was sent to Promptly."
      : "Thanks — your report was saved for review.";
    submit.textContent = "Sent";
    track("listing_reported");
  } catch (err) {
    status.className = "report-status err";
    status.textContent = err.message || "Could not send that. Try again.";
    submit.disabled = false;
    submit.textContent = "Send report";
  }
});

function saveOpening(reference) {
  const item = resolveOpening(reference);
  if (!item) return;
  const listingKey = alertIdentity(item);
  if (saved.has(listingKey)) {
    saved.delete(listingKey);
  } else {
    saved.set(listingKey, item);
  }
  persistSavedCompanies();
  renderOpenings();
  setFeatured();
  refreshSavedList();
}

function persistSavedCompanies() {
  try {
    localStorage.setItem(savedStorageKey, JSON.stringify([...saved.keys()]));
  } catch {}
  profile.savedAlerts = [...saved.values()].map((item) => ({
    company: item.company,
    role: item.role,
    program: item.program,
    deadline: item.deadline,
    field: item.field,
    sourceUrl: item.sourceUrl,
    browse: item.browse,
  }));
  saveProfile();
  saveSubscriber();
  scheduleAccountSync();
}

function restoreSavedCompanies() {
  try {
    const references = JSON.parse(localStorage.getItem(savedStorageKey) || "[]");
    saved.clear();
    if (!Array.isArray(references)) return;
    let migrated = false;
    references.forEach((reference) => {
      const item = resolveOpening(reference);
      if (!item) return;
      const listingKey = alertIdentity(item);
      saved.set(listingKey, item);
      if (listingKey !== reference) migrated = true;
    });
    if (migrated) localStorage.setItem(savedStorageKey, JSON.stringify([...saved.keys()]));
    profile.savedAlerts = [...saved.values()].map((item) => ({
      company: item.company,
      role: item.role,
      program: item.program,
      deadline: item.deadline,
      field: item.field,
      sourceUrl: item.sourceUrl,
      browse: item.browse,
    }));
  } catch {}
}

function refreshSavedList() {
  emptyState.hidden = saved.size > 0;
  savedList.innerHTML = [...saved.values()].map(openingRow).join("");
}

function renderFieldChoices() {
  fieldGrid.innerHTML = fieldOptions.map((field) => `<button data-field-choice="${field}">${field}</button>`).join("");
  const editGrid = document.querySelector("[data-edit-field-grid]");
  if (editGrid) editGrid.innerHTML = fieldOptions.map((field) => `<button data-edit-field-choice="${field}">${field}</button>`).join("");
  updateFieldButtons();
}

function updateFieldButtons() {
  document.querySelectorAll("[data-field-choice]").forEach((button) => {
    button.classList.toggle("active", profile.fields.includes(button.dataset.fieldChoice));
  });
  document.querySelectorAll("[data-edit-field-choice]").forEach((button) => {
    button.classList.toggle("active", profile.fields.includes(button.dataset.editFieldChoice));
  });
}

function setOnboardingStep(step) {
  document.body.classList.toggle("launch-active", String(step) === "0");
  document.querySelectorAll(".onboard-step").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.step === String(step));
  });
}

// Match a keyword in free text. Short keywords (<= 3 chars like "pr", "ib",
// "ai") must match a whole word, or they false-positive inside longer words
// ("pr" inside "pre-med"). Longer keywords match as substrings so phrases
// like "software engineering" still hit "software".
function keywordInText(keyword, text) {
  if (keyword.length <= 3) {
    return new RegExp(`(^|[^a-z])${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(text);
  }
  return text.includes(keyword);
}

function inferFieldsFromText(value) {
  const text = String(value || "").toLowerCase();
  return fieldOptions.filter((field) => interestKeywords[field].some((keyword) => keywordInText(keyword, text)));
}

// A résumé mentions a lot of things in passing, so raw keyword matching can
// light up half the grid and stop meaning anything. Rank by how many distinct
// keywords actually hit, and keep only the strongest few.
const MAX_AUTO_FIELDS = 4;

function rankedInferredFields(value) {
  const text = String(value || "").toLowerCase();
  return fieldOptions
    .map((field) => ({
      field,
      hits: interestKeywords[field].filter((keyword) => keywordInText(keyword, text)).length,
    }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || fieldOptions.indexOf(a.field) - fieldOptions.indexOf(b.field))
    .map((entry) => entry.field);
}

// Everything the student has told us in their own words. These are the only
// inputs field inference is allowed to read, so "what's selected" always has a
// visible cause the student can point at.
// Section headings are résumé structure, not things the student is into.
// Every résumé has an "EDUCATION" heading and most have "SKILLS" — matching on
// those says nothing about the person.
const RESUME_SECTION_HEADING = /^[ \t]*(education|academic background|professional experience|work experience|experience|employment|entrepreneurship|technical skills|skills|certifications?|awards?|honou?rs?|leadership[^\n]{0,40}|extracurriculars?|activities|projects?|summary|objective|profile|references|coursework|relevant coursework|volunteer(?: experience)?)[ \t]*:?[ \t]*$/gim;

function resumeInferenceText() {
  return String(profile.resumeText || "").replace(RESUME_SECTION_HEADING, " ");
}

function inferenceSourceText() {
  return [profile.major, profile.interests, resumeInferenceText()].filter(Boolean).join(" ");
}

// Recompute the selected fields from the CURRENT text.
//
// This used to be a union that only ever grew (mergeFields), which meant
// deleting your résumé left every field it had picked still switched on — the
// selection stopped matching the thing it claimed to be based on. Now the
// inferred set is derived fresh each time, and the student's own taps are kept
// separately so re-inferring can never silently undo a deliberate choice:
//
//   selected = (inferred ∪ manually turned on) − manually turned off
function syncInferredFields() {
  const ranked = rankedInferredFields(inferenceSourceText());
  // Cap what we switch on automatically. Everything stays tappable, and
  // "show all" (below) opts into the rest — but we don't decide for them that
  // eight fields matter just because their résumé said the words.
  const inferred = profile.showAllInferredFields ? ranked : ranked.slice(0, MAX_AUTO_FIELDS);
  const manualOn = Array.isArray(profile.manualFieldsOn) ? profile.manualFieldsOn : [];
  const manualOff = Array.isArray(profile.manualFieldsOff) ? profile.manualFieldsOff : [];
  profile.fields = [...new Set([...inferred, ...manualOn])].filter((field) => !manualOff.includes(field));
  profile.inferredOverflow = Math.max(0, ranked.length - inferred.length);
  updateFieldButtons();
  renderMoreFieldsButton();
}

// "I have more" — reveals the matches held back by the cap.
function renderMoreFieldsButton() {
  document.querySelectorAll("[data-more-fields]").forEach((button) => {
    const overflow = profile.inferredOverflow || 0;
    button.hidden = overflow < 1 || profile.showAllInferredFields === true;
    button.textContent = `I have more — add ${overflow} more match${overflow === 1 ? "" : "es"}`;
  });
}

// Record a deliberate tap so later re-inference respects it in both directions.
function setFieldChoice(field, selected) {
  const on = new Set(Array.isArray(profile.manualFieldsOn) ? profile.manualFieldsOn : []);
  const off = new Set(Array.isArray(profile.manualFieldsOff) ? profile.manualFieldsOff : []);
  if (selected) { on.add(field); off.delete(field); } else { off.add(field); on.delete(field); }
  profile.manualFieldsOn = [...on];
  profile.manualFieldsOff = [...off];
  syncInferredFields();
}


function updateAcademicProfile() {
  profile.school = document.querySelector("[data-school-input]").value.trim();
  profile.gradYear = document.querySelector("[data-grad-year-input]").value.trim();
  profile.major = document.querySelector("[data-major-input]").value.trim();
  profile.preferredLocation = document.querySelector("[data-location-input]").value.trim();
  profile.remoteOkay = document.querySelector("[data-remote-input]").checked;
  profile.willingToRelocate = document.querySelector("[data-relocate-input]").checked;
  syncInferredFields();
}

// Set while a reset is in flight. A debounced save that fires between "clear
// storage" and "reload" would write the profile straight back, which is how a
// restart could appear to do nothing — so once we're resetting, nothing saves.
let resettingClientState = false;

function saveProfile() {
  if (resettingClientState) return;
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  scheduleAccountSync();
}

function accountProfile() {
  return {
    name: profile.name,
    email: profile.email,
    school: profile.school,
    gradYear: profile.gradYear,
    major: profile.major,
    preferredLocation: profile.preferredLocation,
    remoteOkay: profile.remoteOkay,
    willingToRelocate: profile.willingToRelocate,
    interests: profile.interests,
    fields: Array.isArray(profile.fields) ? profile.fields : [],
    emailNotifications: profile.emailNotifications !== false,
    pushNotifications: profile.pushNotifications !== false,
    weeklyRecap: profile.weeklyRecap !== false,
    deadlineReminders: profile.deadlineReminders !== false,
  };
}

// Exact allowlist for Promptly's alert API. Do not serialize the whole profile:
// it also contains résumé text, a photo data URL, and device-only UI state.
function serverAlertProfile() {
  return {
    ...accountProfile(),
    savedAlerts: Array.isArray(profile.savedAlerts) ? profile.savedAlerts : [],
    watches: Array.isArray(profile.watches) ? profile.watches : [],
  };
}

async function authenticatedJsonHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (!authClient) return headers;
  try {
    const { data } = await authClient.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {}
  return headers;
}

function scheduleAccountSync() {
  if (!authClient || !authUser || accountSyncPaused) return;
  window.clearTimeout(accountSyncTimer);
  accountSyncTimer = window.setTimeout(syncAccountState, 250);
}

async function syncAccountState() {
  if (!authClient || !authUser || accountSyncPaused) return;
  const { data, error } = await authClient.auth.updateUser({
    data: {
      promptly_profile: accountProfile(),
      promptly_saved: [...saved.keys()],
    },
  });
  if (!error && data?.user) authUser = data.user;
  updateAccountUI(error ? "Account sync needs attention" : "Synced across devices");
}

function fillProfileInputs() {
  document.querySelector("[data-name-input]").value = profile.name || "";
  document.querySelector("[data-email-input]").value = profile.email || "";
  document.querySelector("[data-school-input]").value = profile.school || "";
  document.querySelector("[data-grad-year-input]").value = profile.gradYear || "";
  document.querySelector("[data-major-input]").value = profile.major || "";
  document.querySelector("[data-location-input]").value = profile.preferredLocation || "";
  document.querySelector("[data-remote-input]").checked = profile.remoteOkay !== false;
  document.querySelector("[data-relocate-input]").checked = profile.willingToRelocate === true;
  document.querySelector("[data-interests-input]").value = profile.interests || "";
  const resumeInput = document.querySelector("[data-resume-input]");
  if (resumeInput) resumeInput.value = profile.resumeText || "";
  showResumeFile(profile.resumeName || "");
}

function updateAccountUI(message = "") {
  const status = document.querySelector("[data-account-status]");
  const connect = document.querySelector("[data-connect-account]");
  const signOut = document.querySelector("[data-sign-out]");
  if (status) status.textContent = authUser ? (message || authUser.email || "Connected") : "Local profile";
  if (connect) connect.hidden = Boolean(authUser);
  if (signOut) signOut.hidden = !authUser;
}

function setAuthMode(mode) {
  authMode = mode === "signin" ? "signin" : "signup";
  document.querySelectorAll("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === authMode));
  document.querySelector("[data-auth-name-group]").hidden = authMode === "signin";
  document.querySelector("[data-auth-submit]").textContent = authMode === "signin" ? "Sign In" : "Create Account";
  document.querySelector("[data-forgot-password]").hidden = authMode !== "signin" || !authClient;
  document.querySelector("[data-password-input]").autocomplete = authMode === "signin" ? "current-password" : "new-password";
  setSignupError();
}

function accountProfileIsComplete() {
  return Boolean(profile.name && profile.email && profile.school && profile.gradYear && profile.major);
}

const routeAuthenticatedUser = window.PromptlyAuthRouting.createAuthenticatedUserRouter({
  applyUser: applyAccountUser,
  isComplete: accountProfileIsComplete,
  showComplete() {
    applyProfileToUI();
    setView("home");
  },
  showIncomplete() {
    document.body.classList.add("onboarding-active");
    setOnboardingStep(2);
  },
});

function applyAccountUser(user) {
  authUser = user;
  const remoteProfile = user?.user_metadata?.promptly_profile;
  const remoteSaved = user?.user_metadata?.promptly_saved;
  const pendingMigrationEmail = localStorage.getItem("promptlyPendingMigrationEmail") || "";
  const shouldMigrateLocal = sessionStorage.getItem("promptlyMigrateLocal") === "1"
    || pendingMigrationEmail.toLowerCase() === String(user?.email || "").toLowerCase();
  accountSyncPaused = true;
  if (remoteProfile && typeof remoteProfile === "object") {
    Object.assign(profile, remoteProfile);
  } else if (!shouldMigrateLocal) {
    Object.assign(profile, {
      name: "",
      email: "",
      school: "",
      gradYear: "",
      major: "",
      preferredLocation: "",
      remoteOkay: true,
      willingToRelocate: false,
      interests: "",
      photoDataUrl: "",
      resumeName: "",
  resumeText: "",
      fields: [],
      manualFieldsOn: [],
      manualFieldsOff: [],
      savedAlerts: [],
      emailNotifications: true,
      pushNotifications: true,
      weeklyRecap: true,
      deadlineReminders: true,
    });
  }
  profile.email = user?.email || profile.email;
  profile.name = profile.name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  fillProfileInputs();
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  if (Array.isArray(remoteSaved)) {
    localStorage.setItem(savedStorageKey, JSON.stringify(remoteSaved));
    restoreSavedCompanies();
    refreshSavedList();
  } else if (!shouldMigrateLocal) {
    saved.clear();
    localStorage.setItem(savedStorageKey, "[]");
    refreshSavedList();
  }
  accountSyncPaused = false;
  sessionStorage.removeItem("promptlyMigrateLocal");
  localStorage.removeItem("promptlyPendingMigrationEmail");
  if (shouldMigrateLocal && !remoteProfile) scheduleAccountSync();
  updateAccountUI();
}

// After a failed or empty OAuth exchange, land the user on the sign-up step
// (only if they're still stuck on the onboarding launch screen).
function showAuthEntryFallback() {
  if (authUser || !document.body.classList.contains("onboarding-active")) return;
  setOnboardingStep(1);
}

// Load the Supabase SDK only when accounts are enabled. Keeping this off the
// critical path means a parked-auth build makes no third-party requests at all,
// which is what our privacy page promises.
let supabaseSdkPromise = null;
function loadSupabaseSdk() {
  if (window.supabase?.createClient) return Promise.resolve(true);
  if (supabaseSdkPromise) return supabaseSdkPromise;
  supabaseSdkPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return supabaseSdkPromise;
}

async function initializeAuth() {
  const authStatus = document.querySelector("[data-auth-status]");
  const callbackUrl = window.location.href;
  const oauthCallback = window.PromptlyAuthRouting.parseOAuthCallback(callbackUrl);
  pendingOAuthCallback = Boolean(oauthCallback);
  if (oauthCallback) {
    const cleanUrl = window.PromptlyAuthRouting.cleanOAuthCallbackUrl(callbackUrl);
    window.history.replaceState(window.history.state, "", cleanUrl);
  }
  try {
    const response = await fetch(`${API_BASE}/api/auth-config`, { headers: { Accept: "application/json" } });
    const config = response.ok ? await response.json() : { enabled: false };
    // Only reach out to the Supabase CDN when accounts are actually switched on.
    // While auth is parked, Promptly loads zero third-party scripts.
    if (config.enabled) await loadSupabaseSdk();
    if (!config.enabled || !window.supabase?.createClient) {
      pendingOAuthCallback = false;
      document.querySelector("[data-auth-password-group]").hidden = true;
      document.querySelector("[data-google-auth]").hidden = true;
      document.querySelector(".auth-tabs").hidden = true;
      authStatus.textContent = "Secure accounts are not connected yet. You can continue with a profile on this device.";
      document.querySelector("[data-auth-submit]").textContent = "Continue";
      updateAccountUI();
      return;
    }

    authClient = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { detectSessionInUrl: false, flowType: "pkce" },
    });
    authStatus.textContent = "Your account securely keeps your profile and saved alerts in sync.";
    authClient.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        if (event === "PASSWORD_RECOVERY") {
          completePasswordReset();
          return;
        }
        if (["SIGNED_IN", "INITIAL_SESSION"].includes(event)) routeAuthenticatedUser(session?.user);
        if (event === "SIGNED_OUT") {
          routeAuthenticatedUser.reset();
          authUser = null;
          updateAccountUI();
        }
      }, 0);
    });
    const session = await window.PromptlyAuthRouting.establishAuthSession(authClient.auth, oauthCallback);
    // Recovery link: the user is signed in via the emailed token, but their
    // password has NOT changed yet — they must set a new one now.
    if (session?.user && oauthCallback?.recovery) await completePasswordReset();
    routeAuthenticatedUser(session?.user);
    pendingOAuthCallback = false;
    // OAuth round-trip produced no session (revoked/expired code) — show the
    // sign-up step instead of leaving the user stranded on the launch screen.
    if (!session?.user && oauthCallback) {
      setSignupError("Google sign-in did not complete. Please try again.");
      showAuthEntryFallback();
    }
  } catch {
    pendingOAuthCallback = false;
    authStatus.textContent = "Account setup could not load. You can continue on this device and try again later.";
    showAuthEntryFallback();
  }
}

async function handleAuthSubmit() {
  const email = document.querySelector("[data-email-input]").value.trim();
  const password = document.querySelector("[data-password-input]").value;
  const name = document.querySelector("[data-name-input]").value.trim();
  const status = document.querySelector("[data-auth-status]");

  if (!authClient) {
    if (!validateSignup()) return;
    profile.name = name;
    profile.email = email;
    setOnboardingStep(2);
    return;
  }
  if (!isValidEmail(email)) return setSignupError("Use a properly formatted email address.");
  if (password.length < 8) return setSignupError("Use a password with at least 8 characters.");
  if (authMode === "signup" && !name) return setSignupError("Add your name first.");

  setSignupError();
  status.textContent = authMode === "signin" ? "Signing you in..." : "Creating your account...";
  if (authMode === "signup") {
    sessionStorage.setItem("promptlyMigrateLocal", "1");
    localStorage.setItem("promptlyPendingMigrationEmail", email);
  }
  else sessionStorage.removeItem("promptlyMigrateLocal");
  const result = authMode === "signin"
    ? await authClient.auth.signInWithPassword({ email, password })
    : await authClient.auth.signUp({ email, password, options: { data: { name } } });
  if (result.error) {
    sessionStorage.removeItem("promptlyMigrateLocal");
    localStorage.removeItem("promptlyPendingMigrationEmail");
    setSignupError(result.error.message || "Account setup failed.");
    status.textContent = "Check your details and try again.";
    return;
  }

  profile.name = name || result.data.user?.user_metadata?.name || profile.name;
  profile.email = result.data.user?.email || email;
  if (result.data.session?.user) {
    routeAuthenticatedUser(result.data.session.user);
  } else {
    saveProfile();
    status.textContent = "Check your email to confirm your account, then return here and sign in.";
  }
}

async function signInWithGoogle() {
  if (!authClient) return;
  if (authMode === "signup") sessionStorage.setItem("promptlyMigrateLocal", "1");
  else sessionStorage.removeItem("promptlyMigrateLocal");
  const { error } = await authClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) {
    sessionStorage.removeItem("promptlyMigrateLocal");
    setSignupError(error.message || "Google sign-in could not start.");
  }
}

// Finish the password-reset flow: the recovery link signs the user in, then
// we prompt for the new password and save it. Without this step the "reset"
// never actually changes the password.
let passwordResetInFlight = false;
async function completePasswordReset() {
  if (!authClient || passwordResetInFlight) return;
  passwordResetInFlight = true;
  try {
    let password = "";
    while (true) {
      password = window.prompt("Set your new Promptly password (at least 8 characters):") || "";
      if (!password) return; // user canceled — they stay signed in via the recovery link
      if (password.length >= 8) break;
      window.alert("Use at least 8 characters.");
    }
    const { error } = await authClient.auth.updateUser({ password });
    const status = document.querySelector("[data-auth-status]");
    if (error) {
      if (status) status.textContent = error.message || "Could not update your password. Try the reset link again.";
      window.alert(error.message || "Could not update your password. Request a new reset link and try again.");
    } else {
      if (status) status.textContent = "Password updated. You're signed in.";
    }
  } finally {
    passwordResetInFlight = false;
  }
}

async function sendPasswordReset() {
  if (!authClient) return;
  const email = document.querySelector("[data-email-input]").value.trim();
  if (!isValidEmail(email)) return setSignupError("Enter your email first.");
  const { error } = await authClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  document.querySelector("[data-auth-status]").textContent = error ? error.message : "Password reset email sent.";
}

async function restartDemo() {
  const resetButton = document.querySelector("[data-reset-demo]");
  if (resetButton) {
    resetButton.disabled = true;
    resetButton.textContent = "Restarting...";
  }

  if (authClient) {
    const { error } = await authClient.auth.signOut();
    if (error) {
      if (resetButton) {
        resetButton.disabled = false;
        resetButton.textContent = "Restart demo";
      }
      updateAccountUI("Could not sign out. Please try again.");
      return;
    }
  }

  authUser = null;

  // Stop anything that could write state back after the wipe: a pending
  // field-inference save, an account sync, or a queued profile save.
  resettingClientState = true;
  window.clearTimeout(inferenceTimer);
  window.clearTimeout(accountSyncTimer);

  // Remove EVERYTHING this origin stored, not a hand-maintained list of keys.
  // The old list missed promptlyStatuses, promptlySeenAlerts and the analytics
  // session id, so application statuses and "already seen" markers survived a
  // restart that promises a clean slate.
  window.PromptlyAuthRouting.clearPromptlyClientState(localStorage, sessionStorage);
  window.location.replace(`${window.location.origin}/`);
}

async function deleteAccount() {
  const button = document.querySelector("[data-delete-account]");
  const status = document.querySelector("[data-delete-account-status]");
  const setStatus = (message) => {
    status.hidden = false;
    status.textContent = message;
  };
  // No signed-in account (auth off or local profile): wipe on-device data instead.
  if (!authClient || !authUser) {
    const confirmation = window.prompt("This erases your Promptly profile and saved alerts from this device. Type DELETE to confirm.");
    if (!window.PromptlyAuthRouting.isAccountDeletionConfirmed(confirmation)) {
      if (confirmation !== null) setStatus("Nothing deleted. Type DELETE exactly to confirm.");
      return;
    }
    resettingClientState = true;
    window.clearTimeout(inferenceTimer);
    window.clearTimeout(accountSyncTimer);
    window.PromptlyAuthRouting.clearPromptlyClientState(localStorage, sessionStorage);
    window.location.replace(`${window.location.origin}/`);
    return;
  }

  const confirmation = window.prompt("This permanently deletes your Promptly account. Type DELETE to confirm.");
  if (!window.PromptlyAuthRouting.isAccountDeletionConfirmed(confirmation)) {
    if (confirmation !== null) setStatus("Account deletion canceled. Type DELETE exactly to confirm.");
    return;
  }

  button.disabled = true;
  setStatus("Deleting your account…");
  try {
    const { data } = await authClient.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error("Your session expired. Sign in and try again.");
    const response = await fetch(`${API_BASE}/api/subscribe`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Couldn’t delete your account right now. Please try again.");

    routeAuthenticatedUser.reset();
    authUser = null;
    window.PromptlyAuthRouting.clearPromptlyClientState(localStorage, sessionStorage);
    window.location.replace(`${window.location.origin}/`);
  } catch (error) {
    button.disabled = false;
    setStatus(error.message || "Account deletion failed.");
  }
}

function isValidEmail(value) {
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function setFormError(selector, message = "") {
  const error = document.querySelector(selector);
  if (!error) return;
  error.textContent = message;
  error.hidden = !message;
}

function setSignupError(message = "") {
  setFormError("[data-signup-error]", message);
}

function setAcademicError(message = "") {
  setFormError("[data-academic-error]", message);
}

function validateSignup() {
  const nameInput = document.querySelector("[data-name-input]");
  const emailInput = document.querySelector("[data-email-input]");
  const typedName = nameInput.value.trim();
  const typedEmail = emailInput.value.trim();

  if (!typedName) {
    setSignupError("Add your name first.");
    nameInput.focus();
    return false;
  }

  if (!isValidEmail(typedEmail)) {
    setSignupError("Use a properly formatted email address.");
    emailInput.focus();
    return false;
  }

  setSignupError();
  return true;
}

function validateAcademicProfile() {
  const schoolInput = document.querySelector("[data-school-input]");
  const yearInput = document.querySelector("[data-grad-year-input]");
  const majorInput = document.querySelector("[data-major-input]");
  const year = yearInput.value.trim();

  if (!schoolInput.value.trim()) {
    setAcademicError("Add your school so the tracking page is accurate.");
    schoolInput.focus();
    return false;
  }

  if (!/^20\d{2}$/.test(year)) {
    setAcademicError("Add a graduation year like 2028.");
    yearInput.focus();
    return false;
  }

  if (!majorInput.value.trim()) {
    setAcademicError("Add your major or type Undecided.");
    majorInput.focus();
    return false;
  }

  setAcademicError();
  updateAcademicProfile();
  return true;
}

// First name only. A full name pushed the greeting to four lines on a phone,
// eating most of the first screen before any actual product showed.
function displayName() {
  const full = profile.name.trim();
  if (!full) return "there";
  return full.split(/\s+/)[0];
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function greetingText() {
  return `${timeGreeting()}, ${displayName()}`;
}

function updateDashboardGreeting() {
  const text = greetingText();
  document.querySelector("[data-title]").textContent = text;
  document.querySelector("#view-home").dataset.heading = text;
}

function applyProfileToUI() {
  document.body.classList.remove("onboarding-active", "launch-active");
  renderFilterChips();
  updateDashboardGreeting();
  updateProfilePhoto();
  document.querySelector("[data-profile-school]").textContent = profile.school || "Not set";
  document.querySelector("[data-profile-year]").textContent = profile.gradYear || "Not set";
  document.querySelector("[data-profile-major]").textContent = profile.major || "Undecided";
  document.querySelector("[data-profile-location]").textContent = profile.preferredLocation || "No preference";
  const flexibility = [profile.remoteOkay !== false ? "Remote" : "", profile.willingToRelocate ? "Relocation" : ""].filter(Boolean);
  document.querySelector("[data-profile-flexibility]").textContent = flexibility.length ? flexibility.join(" and ") : "Local only";
  document.querySelector("[data-profile-interests]").textContent = profile.interests || "Not set";
  document.querySelector("[data-profile-fields]").textContent = profile.fields.length ? profile.fields.join(", ") : "All fields";
  updateAccountUI();
  document.querySelector("[data-home-school]").textContent = profile.school || "Your school";
  document.querySelector("[data-home-year]").textContent = profile.gradYear ? `Class of ${profile.gradYear}` : "Graduation year";
  document.querySelector("[data-home-major]").textContent = profile.major || "Your major";
  updateTrackedCount();
  document.querySelectorAll("[data-notification-pref]").forEach((input) => {
    input.checked = profile[input.dataset.notificationPref] !== false;
  });
  updateAlertIntelligence();
  setFeatured();
  renderVerificationNotice();
  renderWatchList();
  renderOpenings();
}

// ── Watch any company ───────────────────────────────────────────────────────
// Paste a careers link; if it's a supported ATS board, Promptly adds it to the
// same live pipeline that powers every other alert. No fake watching: an
// unreadable page is logged as a request and told to the user plainly.
function watchList() {
  return Array.isArray(profile.watches) ? profile.watches : (profile.watches = []);
}

function setWatchStatus(message, tone = "") {
  const el = document.querySelector("[data-watch-status]");
  if (!el) return;
  el.textContent = message || "";
  el.hidden = !message;
  el.classList.toggle("is-good", tone === "good");
  el.classList.toggle("is-bad", tone === "bad");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderWatchList() {
  const list = document.querySelector("[data-watch-list]");
  if (!list) return;
  const watches = watchList();
  if (!watches.length) {
    list.innerHTML = `<p class="watch-empty">You're not watching any companies yet. Paste a careers link above and Promptly will watch it for you.</p>`;
    return;
  }
  list.innerHTML = watches.map((w) => {
    const initials = escapeHtml((w.company || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0] || "").join("").toUpperCase() || "•");
    const company = escapeHtml(w.company || "This company");
    return `<div class="watch-item">
      <span class="watch-badge">${initials}</span>
      <span class="watch-meta"><strong>${company}</strong><small>Watching for 2027 internships</small></span>
      <button class="watch-remove" data-watch-remove="${escapeHtml(w.id || "")}" type="button">Stop</button>
    </div>`;
  }).join("");
}

async function submitWatch() {
  const urlInput = document.querySelector("[data-watch-url]");
  const companyInput = document.querySelector("[data-watch-company]");
  const button = document.querySelector("[data-watch-submit]");
  if (!urlInput) return;
  const url = urlInput.value.trim();
  const company = companyInput ? companyInput.value.trim() : "";
  if (!url) { setWatchStatus("Paste a company careers link first.", "bad"); return; }
  if (!profile.email) { setWatchStatus("Add your email in your profile first, so we know where to send the alert.", "bad"); return; }

  button.disabled = true;
  setWatchStatus("Checking that link…");
  try {
    const response = await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({ action: "watch", url, company, profile: { email: profile.email } }),
    });
    const data = await response.json().catch(() => ({}));

    if (data.status === "watching") {
      profile.watches = Array.isArray(data.watches) && data.watches.length
        ? data.watches
        : [...watchList().filter((w) => w.id !== data.id), { id: data.id, company: data.company, url, ats: data.ats }];
      localStorage.setItem(profileStorageKey, JSON.stringify(profile));
      const openLine = data.openNow > 0
        ? `${data.openNow} matching role${data.openNow === 1 ? "" : "s"} are open right now — check your feed.`
        : `Nothing matching is posted yet. You'll get an alert the moment a 2027 role opens.`;
      setWatchStatus(`✅ Now watching ${data.company}. ${openLine}`, "good");
      urlInput.value = "";
      if (companyInput) companyInput.value = "";
      renderWatchList();
    } else if (data.status === "logged") {
      setWatchStatus(data.reason || "We logged that page for our team to review.", "");
      urlInput.value = "";
      if (companyInput) companyInput.value = "";
    } else if (data.reason || data.error) {
      // The server actually looked at the link and told us why it won't work.
      setWatchStatus(data.reason || data.error, "bad");
    } else {
      // No structured reason came back — that's our end being unavailable, not
      // a bad link, so don't send the student off to re-check something fine.
      setWatchStatus("We couldn't reach Promptly just now. Your link is probably fine — try again in a moment.", "bad");
    }
  } catch {
    setWatchStatus("Network hiccup — try again in a moment.", "bad");
  } finally {
    button.disabled = false;
  }
}

async function removeWatch(id) {
  profile.watches = watchList().filter((w) => w.id !== id);
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  renderWatchList();
  setWatchStatus("Stopped watching.", "");
  if (!profile.email) return;
  try {
    await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({ action: "unwatch", id, profile: { email: profile.email } }),
    });
  } catch {}
}

function updateProfilePhoto() {
  const initial = profile.name.trim()[0]?.toUpperCase() || "P";
  document.querySelectorAll(".profile-chip, [data-photo-button]").forEach((button) => {
    button.textContent = profile.photoDataUrl ? "" : initial;
    button.style.backgroundImage = profile.photoDataUrl ? `url("${profile.photoDataUrl}")` : "";
    button.classList.toggle("has-photo", Boolean(profile.photoDataUrl));
  });
}

function openProfileEditor() {
  document.querySelector("[data-edit-name]").value = profile.name || "";
  document.querySelector("[data-edit-email]").value = profile.email || "";
  document.querySelector("[data-edit-email]").readOnly = Boolean(authUser);
  document.querySelector("[data-edit-school]").value = profile.school || "";
  document.querySelector("[data-edit-year]").value = profile.gradYear || "";
  document.querySelector("[data-edit-major]").value = profile.major || "";
  document.querySelector("[data-edit-location]").value = profile.preferredLocation || "";
  document.querySelector("[data-edit-remote]").checked = profile.remoteOkay !== false;
  document.querySelector("[data-edit-relocate]").checked = profile.willingToRelocate === true;
  document.querySelector("[data-edit-interests]").value = profile.interests || "";
  updateFieldButtons();
  if (typeof profileModal.showModal === "function") profileModal.showModal();
}

function saveProfileEdits() {
  invalidateLocationSearch();
  profile.name = document.querySelector("[data-edit-name]").value.trim();
  profile.email = document.querySelector("[data-edit-email]").value.trim();
  profile.school = document.querySelector("[data-edit-school]").value.trim();
  profile.gradYear = document.querySelector("[data-edit-year]").value.trim();
  profile.major = document.querySelector("[data-edit-major]").value.trim();
  profile.preferredLocation = document.querySelector("[data-edit-location]").value.trim();
  profile.remoteOkay = document.querySelector("[data-edit-remote]").checked;
  profile.willingToRelocate = document.querySelector("[data-edit-relocate]").checked;
  profile.interests = document.querySelector("[data-edit-interests]").value.trim();
  document.querySelector("[data-name-input]").value = profile.name;
  document.querySelector("[data-email-input]").value = profile.email;
  document.querySelector("[data-school-input]").value = profile.school;
  document.querySelector("[data-grad-year-input]").value = profile.gradYear;
  document.querySelector("[data-major-input]").value = profile.major;
  document.querySelector("[data-location-input]").value = profile.preferredLocation;
  document.querySelector("[data-remote-input]").checked = profile.remoteOkay;
  document.querySelector("[data-relocate-input]").checked = profile.willingToRelocate;
  document.querySelector("[data-interests-input]").value = profile.interests;
  syncInferredFields();
  saveProfile();
  saveSubscriber();
  applyProfileToUI();
  profileModal.close();
}

function restoreProfile() {
  try {
    const savedProfile = JSON.parse(localStorage.getItem(profileStorageKey) || "null");
    if (!savedProfile) return false;
    Object.assign(profile, savedProfile);
    // Profiles saved before fields tracked manual intent have no record of WHY
    // anything was selected. Work it out instead of guessing: anything their
    // own text explains is treated as inferred (so it now clears when that text
    // does), and anything it doesn't must have been tapped by hand, so it stays.
    if (!Array.isArray(savedProfile.manualFieldsOn)) {
      const explained = inferFieldsFromText(inferenceSourceText());
      profile.manualFieldsOn = (profile.fields || []).filter((field) => !explained.includes(field));
      profile.manualFieldsOff = [];
    }
    fillProfileInputs();
    // Résumé matching is live now — reflect the saved file instead of the old
    // "coming soon" placeholder this used to show.
    if (profile.resumeName) {
      showResumeFile(profile.resumeName);
      setResumeStatus(`Using ${profile.resumeName} — stored on this device only.`, "ok");
    }
    applyProfileToUI();
    setView("home");
    return true;
  } catch (error) {
    // Surface it: swallowing this silently once hid a real startup bug that
    // stopped returning users' profiles from being applied at all.
    console.error("Promptly: could not restore saved profile", error);
    return false;
  }
}

function enterApp() {
  const typedName = document.querySelector("[data-name-input]").value.trim();
  const typedEmail = document.querySelector("[data-email-input]").value.trim();
  const typedInterests = document.querySelector("[data-interests-input]").value.trim();
  const typedResume = document.querySelector("[data-resume-input]")?.value.trim() || "";
  if (!validateSignup() || !validateAcademicProfile()) return;
  if (typedName) profile.name = typedName;
  if (typedEmail) profile.email = typedEmail;
  profile.interests = typedInterests;
  // An uploaded file already set resumeText; don't let the textarea (which
  // mirrors it) be the authority when a real file is attached.
  if (!profile.resumeName) profile.resumeText = typedResume.slice(0, 8000);
  syncInferredFields();
  saveProfile();
  saveSubscriber();
  track("signup");
  applyProfileToUI();
  setView("home");
}

// ── Device-aware notification copy ────────────────────────────────────────
// Promptly is a PWA that runs on both phones and desktop browsers, but the
// notification copy was written phone-first: "Add to your Home Screen",
// "lock-screen alerts", "Enable Phone Notifications". On a laptop that is
// simply wrong — desktop push goes to the OS notification centre and needs no
// Home Screen step — so it reads as instructions for a device the student
// isn't holding.
function isIOSDevice() {
  const ua = navigator.userAgent || "";
  // iPadOS 13+ reports as a Mac, so the touch-point check is what separates a
  // real iPad from a desktop Safari.
  return /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1);
}

function isMobileDevice() {
  if (isIOSDevice()) return true;
  if (/Android|Mobile|Silk|Kindle|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent || "")) return true;
  // Coarse pointer + no hover is the reliable signal for a touch device that
  // doesn't advertise itself in the user-agent string.
  return typeof window.matchMedia === "function"
    && window.matchMedia("(pointer: coarse)").matches
    && window.matchMedia("(hover: none)").matches;
}

// The one place that decides what a "notification" is called on this device.
function pushCopy() {
  const mobile = isMobileDevice();
  const ios = isIOSDevice();
  return {
    label: mobile ? "Enable Phone Notifications" : "Enable Notifications",
    pillText: mobile ? "PHONE ALERTS" : "DESKTOP ALERTS",
    heading: mobile ? "Test real lock-screen alerts." : "Test real desktop notifications.",
    // Only iOS actually requires the Home Screen install step; Android and
    // desktop can subscribe straight from the browser.
    intro: ios
      ? "Add Promptly to your Home Screen, then enable alerts and send a test notification."
      : mobile
        ? "Enable alerts, then send yourself a test notification."
        : "Enable browser notifications, then send yourself a test to confirm they arrive.",
    settingsIntro: ios
      ? "Get instant lock-screen alerts when a matching internship drops. Add Promptly to your Home Screen first on iPhone."
      : mobile
        ? "Get instant alerts on your device the moment a matching internship drops."
        : "Get instant desktop notifications the moment a matching internship drops.",
    prompt: ios
      ? "Tap Enable Phone Notifications first. If you are on iPhone, open Promptly from the Home Screen app icon."
      : mobile
        ? "Tap Enable Phone Notifications to turn on alerts."
        : "Click Enable Notifications, then allow them when your browser asks.",
    unsupported: ios
      ? "On iPhone, first add Promptly to your Home Screen (Share → Add to Home Screen), then open it from that icon to turn on alerts."
      : mobile
        ? "This browser can't do push notifications. Try Chrome, or use email alerts instead."
        : "This browser doesn't support notifications. Try Chrome, Edge, or Safari — or use email alerts instead.",
    blocked: ios
      ? "Notifications are blocked. Fix: iPhone Settings → Notifications → Promptly → Allow Notifications. (Or remove Promptly from your Home Screen and re-add it, then tap Allow.)"
      : mobile
        ? "Notifications are blocked. Turn them back on for Promptly in your browser or system settings."
        : "Notifications are blocked for this site. Click the lock icon in your address bar → Notifications → Allow, then try again.",
    allow: mobile ? "Tap Allow when your phone asks, to turn on alerts." : "Click Allow when your browser asks, to turn on notifications.",
    testSent: mobile ? "Test sent. Check your lock screen or notification center." : "Test sent. Check your desktop notifications.",
  };
}

// Swap the static phone-first copy for whatever this device actually needs.
function applyDeviceNotificationCopy() {
  const copy = pushCopy();
  document.querySelectorAll("[data-enable-push]").forEach((btn) => { btn.textContent = copy.label; });
  document.querySelectorAll("[data-push-pill]").forEach((el) => { el.textContent = copy.pillText; });
  document.querySelectorAll("[data-push-heading]").forEach((el) => { el.textContent = copy.heading; });
  document.querySelectorAll("[data-push-intro]").forEach((el) => { el.textContent = copy.intro; });
  document.querySelectorAll("[data-push-settings-intro]").forEach((el) => { el.textContent = copy.settingsIntro; });
  document.querySelectorAll("[data-push-status]").forEach((el) => { el.textContent = copy.prompt; });
}

function setPushStatus(message) {
  document.querySelectorAll("[data-push-status]").forEach((item) => {
    item.textContent = message;
  });
}

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    setPushStatus("This browser does not support service workers yet.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    setPushStatus("Service worker setup failed. Deploy on HTTPS or use localhost to test.");
    return null;
  }
}

async function getVapidPublicKey() {
  try {
    const response = await fetch(`${API_BASE}/api/vapid-public-key`);
    if (!response.ok) return fallbackVapidPublicKey;
    const data = await response.json();
    return data.publicKey || fallbackVapidPublicKey;
  } catch {
    return fallbackVapidPublicKey;
  }
}

function renderVerificationNotice() {
  const hide = !profile.email || emailVerified || document.body.classList.contains("onboarding-active");

  const el = document.querySelector("[data-verify-notice]");
  if (el) {
    el.hidden = hide;
    if (!hide) el.textContent = `Email alerts are paused until you confirm ${profile.email}. Check your inbox for the confirmation link.`;
  }

  // Persistent bar across every view — easy to miss a notice buried in Settings.
  const banner = document.querySelector("[data-verify-banner]");
  const text = document.querySelector("[data-verify-banner-text]");
  if (!banner) return;
  banner.hidden = hide;
  if (!hide && text) {
    text.textContent = `Confirm ${profile.email} to switch on email alerts. Unconfirmed profiles are deleted after 14 days.`;
  }
}

// Tuck the confirmation bar out of the way while reading down the page, and
// bring it straight back on any upward scroll. It is deliberately not
// dismissible — unconfirmed means no email alert can send at all, and the
// profile is deleted at day 14 — so it hides only while you're reading past it.
(function setupVerifyBannerScroll() {
  const banner = document.querySelector("[data-verify-banner]");
  if (!banner) return;

  const TUCK_AFTER = 90;  // don't tuck until scrolled clear of the bar itself
  const JITTER = 6;       // ignore trackpad noise so it doesn't flicker
  let lastY = window.scrollY;
  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY;
    const delta = y - lastY;
    if (Math.abs(delta) < JITTER) return;

    // Near the top it always shows, so it can never be scrolled into hiding
    // and forgotten about.
    if (y <= TUCK_AFTER) banner.classList.remove("is-tucked");
    else banner.classList.toggle("is-tucked", delta > 0);
    lastY = y;
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
})();

// Ask the server to send another confirmation link.
async function resendVerification() {
  const button = document.querySelector("[data-verify-resend]");
  const text = document.querySelector("[data-verify-banner-text]");
  if (!profile.email || !button) return;
  button.disabled = true;
  const previous = button.textContent;
  button.textContent = "Sending…";
  try {
    const response = await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({ action: "resend-verification", profile: { email: profile.email } }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.alreadyVerified) {
      emailVerified = true;
      renderVerificationNotice();
      return;
    }
    if (text) {
      text.textContent = data.sent
        ? `Sent. Check ${profile.email} — including your spam folder.`
        : data.error || "Couldn't send that just now. Try again in a moment.";
    }
  } catch {
    if (text) text.textContent = "Couldn't reach Promptly just now. Try again in a moment.";
  } finally {
    button.disabled = false;
    button.textContent = previous;
  }
}

async function saveSubscriber(subscription = null) {
  try {
    const response = await fetch(`${API_BASE}/api/subscribe`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({ subscription, profile: serverAlertProfile() }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.setupRequired) setPushStatus("Notifications aren’t fully switched on yet — we’re finishing setup. Check back soon.");
    // Email alerts stay off until the address is confirmed, so say so plainly
    // rather than letting someone wait for alerts that will never arrive.
    emailVerified = data.verified === true;
    if (data.verificationSent) {
      setPushStatus("Check your inbox — tap the confirmation link and your email alerts switch on.");
    }
    renderVerificationNotice();
    return response.ok || response.status === 202;
  } catch {
    return false;
  }
}

async function enablePushAlerts() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    setPushStatus(pushCopy().unsupported);
    return null;
  }

  // iOS needs the permission request triggered directly by the tap — do it first.
  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch (e) {
    setPushStatus("Couldn't ask for permission: " + (e.message || e));
    return null;
  }
  if (permission !== "granted") {
    const copy = pushCopy();
    setPushStatus(permission === "denied" ? copy.blocked : copy.allow);
    return null;
  }

  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    const serverKey = urlBase64ToUint8Array(await getVapidPublicKey());
    let existing = await registration.pushManager.getSubscription();
    // If the subscription was created under a different (old/rotated) VAPID
    // key, every push to it fails. Drop it and re-subscribe with the current key.
    if (existing && existing.options?.applicationServerKey) {
      const existingKey = new Uint8Array(existing.options.applicationServerKey);
      const sameKey = existingKey.length === serverKey.length && existingKey.every((b, i) => b === serverKey[i]);
      if (!sameKey) {
        try { await existing.unsubscribe(); } catch {}
        existing = null;
      }
    }
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: serverKey,
    });
    localStorage.setItem("openingPushSubscription", JSON.stringify(subscription));
    setPushStatus("✅ Phone alerts enabled. Tap Send Test Notification.");
    await saveSubscriber(subscription);
    return subscription;
  } catch (e) {
    setPushStatus("Couldn't turn on push: " + (e.message || e));
    return null;
  }
}

// A test alert should demonstrate the real thing: a verified live posting.
// Falling back to the first ranked item meant a test could announce a careers
// -page placeholder as though a specific req had just opened.
function bestVerifiedOpening() {
  const ranked = preferredOpenings();
  return ranked.find((entry) => listingStatus(entry) === "OPEN") || ranked[0] || null;
}

function currentTestOpening() {
  const item = bestVerifiedOpening();
  if (!item) return null;
  return {
    company: item.company,
    role: item.role,
    program: item.program,
    deadline: item.deadline,
    field: item.field,
    sourceUrl: item.sourceUrl,
    browse: item.browse,
  };
}

async function sendTestAlert() {
  if (!validateSignup()) {
    setView("home");
    return;
  }

  const raw = localStorage.getItem("openingPushSubscription");
  setPushStatus("Sending a test email alert...");

  try {
    const response = await fetch(`${API_BASE}/api/send-alert`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({
        opening: currentTestOpening(),
        profile: serverAlertProfile(),
        subscription: raw ? JSON.parse(raw) : null,
      }),
    });
    const data = await response.json();
    const uniqueErrors = [...new Set((data.errors || []).filter(Boolean))];
    const notReady = (Array.isArray(data.setupRequired) && data.setupRequired.length) ||
      uniqueErrors.some((e) => /verify a domain|own email address|key|env|vercel|redis|resend/i.test(e));
    if (response.ok && data.emailSent > 0) {
      setPushStatus(`Test email sent to ${profile.email}. Check your inbox and spam folder.`);
    } else if (notReady) {
      setPushStatus("Email alerts aren’t fully switched on yet — we’re finishing setup. Check back soon.");
    } else {
      setPushStatus(data.error || uniqueErrors[0] || "Couldn’t send the test email. Please try again.");
    }
  } catch {
    setPushStatus("Couldn’t send the test email right now. Please try again in a bit.");
  }
}

async function sendTestPush() {
  let raw = localStorage.getItem("openingPushSubscription");
  if (!raw) {
    const sub = await enablePushAlerts();
    // enablePushAlerts already showed the exact reason if it failed.
    if (!sub) return;
    raw = JSON.stringify(sub);
  }

  setPushStatus("Sending a real test notification...");

  try {
    const response = await fetch(`${API_BASE}/api/send-test`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({
        subscription: JSON.parse(raw),
        title: "Promptly",
        body: (() => {
          const item = bestVerifiedOpening();
          if (!item) return "A new internship opening is live.";
          return listingStatus(item) === "OPEN"
            ? `${item.company} ${item.role} just opened.`
            : `${item.company} is on your watch list — open Promptly to see what's live.`;
        })(),
        url: bestVerifiedOpening()?.sourceUrl || "/",
      }),
    });
    const data = await response.json();
    setPushStatus(response.ok ? pushCopy().testSent : "Couldn’t send the test notification. Please try again.");
  } catch {
    setPushStatus("Couldn’t send the test notification right now. Please try again in a bit.");
  }
}

async function sendTestWeeklyRecap() {
  if (!validateSignup()) {
    setView("home");
    return;
  }
  setPushStatus("Sending your weekly recap test...");
  try {
    const raw = localStorage.getItem("openingPushSubscription");
    const response = await fetch(`${API_BASE}/api/send-recap`, {
      method: "POST",
      headers: await authenticatedJsonHeaders(),
      body: JSON.stringify({
        profile: serverAlertProfile(),
        subscription: raw ? JSON.parse(raw) : null,
      }),
    });
    const data = await response.json();
    setPushStatus(response.ok
      ? `Weekly recap sent with ${data.count} matching alerts. Check your inbox.`
      : data.setupRequired
        ? "Weekly recap isn’t fully switched on yet — we’re finishing setup. Check back soon."
        : data.error || "Couldn’t send the weekly recap. Please try again.");
  } catch {
    setPushStatus("Couldn’t send the weekly recap right now. Please try again in a bit.");
  }
}

renderFieldChoices();
updateDashboardGreeting();
rebuildPlaceholders();
migrateLegacyStatuses();
restoreSavedCompanies();
renderOpenings();
setFeatured();
refreshSavedList();

renderVerificationNotice();

if (!restoreProfile()) {
  window.setTimeout(() => {
    // A signed-in user has already been routed (or is mid-OAuth exchange) —
    // never drag them back to the sign-up screen.
    if (authUser || pendingOAuthCallback) return;
    setOnboardingStep(1);
  }, 1200);
}
initializeAuth();

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-verify-resend]")) { event.preventDefault(); await resendVerification(); return; }

  const watchSubmitButton = event.target.closest("[data-watch-submit]");
  if (watchSubmitButton) { event.preventDefault(); await submitWatch(); return; }
  const watchRemoveButton = event.target.closest("[data-watch-remove]");
  if (watchRemoveButton) { event.preventDefault(); await removeWatch(watchRemoveButton.dataset.watchRemove); return; }

  // "Watch <Company>" on an unreadable-employer card: send the student to the
  // watch form with the company prefilled, rather than dead-ending them.
  const watchThisButton = event.target.closest("[data-watch-company-name]");
  if (watchThisButton) {
    event.preventDefault();
    event.stopPropagation();
    const company = watchThisButton.dataset.watchCompanyName || "";
    setView("alerts");
    window.setTimeout(() => {
      const nameInput = document.querySelector("[data-watch-company]");
      const urlInput = document.querySelector("[data-watch-url]");
      if (nameInput) nameInput.value = company;
      if (urlInput) {
        urlInput.focus();
        urlInput.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      setWatchStatus(`Paste ${company}'s careers link and Promptly will watch it for you.`, "");
    }, 60);
    return;
  }

  const nextButton = event.target.closest("[data-next-step]");
  const fieldButton = event.target.closest("[data-field-choice]");
  const editFieldButton = event.target.closest("[data-edit-field-choice]");
  const finishButton = event.target.closest("[data-finish-onboarding]");
  const viewButton = event.target.closest("[data-view]");
  const detailsButton = event.target.closest("[data-open-details-button], [data-open-details]");
  const saveButton = event.target.closest("[data-save]");
  const filterButton = event.target.closest(".filter-chip");
  const closeButton = event.target.closest(".close-modal");
  const enablePushButton = event.target.closest("[data-enable-push]");
  const sendTestButton = event.target.closest("[data-send-test-push]");
  const sendTestAlertButton = event.target.closest("[data-send-test-alert]");
  const sendWeeklyRecapButton = event.target.closest("[data-send-weekly-recap]");
  const saveModalButton = event.target.closest("[data-save-modal]");
  const resetDemoButton = event.target.closest("[data-reset-demo]");
  const photoButton = event.target.closest("[data-photo-button]");
  const editProfileButton = event.target.closest("[data-edit-profile]");
  const saveProfileButton = event.target.closest("[data-save-profile-edits]");
  const closeProfileButton = event.target.closest("[data-close-profile-modal]");
  const authModeButton = event.target.closest("[data-auth-mode]");
  const authSubmitButton = event.target.closest("[data-auth-submit]");
  const googleAuthButton = event.target.closest("[data-google-auth]");
  const forgotPasswordButton = event.target.closest("[data-forgot-password]");
  const connectAccountButton = event.target.closest("[data-connect-account]");
  const signOutButton = event.target.closest("[data-sign-out]");
  const deleteAccountButton = event.target.closest("[data-delete-account]");

  if (authModeButton) setAuthMode(authModeButton.dataset.authMode);
  if (authSubmitButton) handleAuthSubmit();
  if (googleAuthButton) signInWithGoogle();
  if (forgotPasswordButton) sendPasswordReset();
  if (connectAccountButton) {
    sessionStorage.setItem("promptlyMigrateLocal", "1");
    document.body.classList.add("onboarding-active");
    setOnboardingStep(1);
  }
  if (signOutButton && authClient) {
    authClient.auth.signOut().then(() => {
      authUser = null;
      // A shared computer must not reveal the previous account's résumé,
      // photo, profile, saved jobs, or Supabase session to the next person.
      resettingClientState = true;
      window.clearTimeout(inferenceTimer);
      window.clearTimeout(accountSyncTimer);
      window.PromptlyAuthRouting.clearPromptlyClientState(localStorage, sessionStorage);
      window.location.replace(`${window.location.origin}/`);
    });
  }
  if (deleteAccountButton) {
    await deleteAccount();
    return;
  }

  if (nextButton) {
    if (nextButton.dataset.nextStep === "2" && !validateSignup()) return;
    if (nextButton.dataset.nextStep === "3" && !validateAcademicProfile()) return;
    setOnboardingStep(nextButton.dataset.nextStep);
  }

  if (fieldButton) {
    const field = fieldButton.dataset.fieldChoice;
    setFieldChoice(field, !profile.fields.includes(field));
  }

  if (editFieldButton) {
    const field = editFieldButton.dataset.editFieldChoice;
    setFieldChoice(field, !profile.fields.includes(field));
  }

  if (finishButton) {
    enterApp();
  }

  if (enablePushButton) {
    enablePushAlerts();
  }

  if (sendTestButton) {
    sendTestPush();
  }

  if (sendTestAlertButton) {
    sendTestAlert();
  }

  if (sendWeeklyRecapButton) {
    sendTestWeeklyRecap();
  }

  if (saveModalButton && modal.dataset.listingId) {
    saveOpening(modal.dataset.listingId);
    saveModalButton.textContent = saved.has(modal.dataset.listingId) ? "Unsave Alert" : "Save Alert";
  }

  if (saveButton) {
    event.preventDefault();
    event.stopPropagation();
    saveOpening(saveButton.dataset.save);
    return;
  }

  if (resetDemoButton) {
    await restartDemo();
    return;
  }

  if (photoButton) {
    document.querySelector("[data-photo-input]").click();
  }


  if (editProfileButton) {
    openProfileEditor();
  }

  if (saveProfileButton) {
    saveProfileEdits();
  }

  if (closeProfileButton) {
    profileModal.close();
  }

  if (viewButton && !document.body.classList.contains("onboarding-active")) {
    event.preventDefault();
    setView(viewButton.dataset.view);
  }

  if (detailsButton) {
    openDetails(detailsButton.dataset.openDetails || detailsButton.dataset.openDetailsButton, detailsButton.dataset.estimate || "");
  }

  if (filterButton) {
    const field = filterButton.textContent.trim();
    const inSearchPanel = filterButton.closest(".search-panel");
    filterButton.parentElement.querySelectorAll(".filter-chip").forEach((button) => button.classList.remove("active"));
    filterButton.classList.add("active");

    // Sub-filter row: show for Finance / Consulting in the openings panel only
    const subFilterRow = document.getElementById("sub-filter-row");
    if (subFilterRow && inSearchPanel) {
      if (subFields[field]) {
        subFilterRow.innerHTML = subFields[field].map((sf, i) =>
          `<button class="sub-filter-chip${i === 0 ? " active" : ""}" data-sub-field="${sf}">${sf}</button>`
        ).join("");
        subFilterRow.hidden = false;
      } else {
        subFilterRow.hidden = true;
      }
    }

    const list = field === "All" ? preferredOpenings() : field === "Saved" ? [...saved.values()] : openings.filter((item) => item.field === field).sort((a, b) => (isAwaitingLike(a) ? 1 : 0) - (isAwaitingLike(b) ? 1 : 0));
    const target = inSearchPanel ? document.querySelector(".full-list") : document.querySelector(".compact-list");
    target.innerHTML = renderRows(list);
  }

  const subFilterChip = event.target.closest("[data-sub-field]");
  if (subFilterChip) {
    document.querySelectorAll(".sub-filter-chip").forEach((btn) => btn.classList.remove("active"));
    subFilterChip.classList.add("active");
    const subField = subFilterChip.dataset.subField;
    const activeMain = document.querySelector(".search-panel .filter-chip.active");
    const field = activeMain ? activeMain.textContent.trim() : "";
    const list = (subField.startsWith("All ")
      ? openings.filter((item) => item.field === field)
      : openings.filter((item) => item.field === field && item.subField === subField)
    ).sort((a, b) => (isAwaitingLike(a) ? 1 : 0) - (isAwaitingLike(b) ? 1 : 0));
    document.querySelector(".full-list").innerHTML = renderRows(list);
  }

  if (closeButton) {
    modal.close();
  }
});

document.querySelector("[data-email-input]")?.addEventListener("input", () => setSignupError());
document.querySelector("[data-name-input]")?.addEventListener("input", () => setSignupError());
// Typing is the other way to tell Promptly what you want, so it has to drive
// the same inference the résumé does — and update as the text shrinks, not just
// as it grows. Debounced so it doesn't recompute on every keystroke.
let inferenceTimer = null;
function scheduleFieldInference() {
  clearTimeout(inferenceTimer);
  inferenceTimer = setTimeout(() => {
    profile.interests = document.querySelector("[data-interests-input]")?.value.trim() || "";
    profile.major = document.querySelector("[data-major-input]")?.value.trim() || profile.major;
    const pasted = document.querySelector("[data-resume-input]")?.value.trim() || "";
    // Only adopt pasted text as the résumé when no uploaded file is in play,
    // otherwise clearing the box would wipe out the file's extracted text.
    if (!profile.resumeName) profile.resumeText = pasted.slice(0, 8000);
    syncInferredFields();
    saveProfile();
  }, 350);
}

document.querySelectorAll("[data-more-fields]").forEach((button) => {
  button.addEventListener("click", () => {
    profile.showAllInferredFields = true;
    syncInferredFields();
    saveProfile();
    saveSubscriber();
  });
});

// Tell them what a location will actually get them BEFORE they finish signing
// up. A student picking a smaller city should hear "we have 2 roles there"
// from us, not work it out from an empty feed later.
function renderLocationCoverageHint() {
  const hint = document.querySelector("[data-location-hint]");
  if (!hint) return;
  const typed = document.querySelector("[data-location-input]")?.value.trim() || "";
  if (!typed || /^no preference$/i.test(typed)) { hint.hidden = true; return; }

  const resolved = geo ? geo.resolve(typed) : null;
  hint.hidden = false;

  // Ambiguous city with no state — ask rather than silently pick one.
  if (resolved && resolved.kind === "ambiguous") {
    hint.textContent = `“${resolved.label}” could be ${resolved.options.slice(0, 3).join(", ")}. Add the state so we search the right one.`;
    hint.dataset.tone = "warn";
    return;
  }
  if (!resolved || resolved.kind !== "point") {
    hint.textContent = `We don't recognise that place yet — we'll still match it by name, but distances will be approximate.`;
    hint.dataset.tone = "warn";
    return;
  }

  const live = openings.filter((item) => !isAwaitingLike(item) && item.location);
  const remote = live.filter(listingIsRemote).length;
  const near = live.filter((item) => {
    const point = geo.resolve(item.location);
    if (!point || point.kind !== "point") return false;
    return geo.milesBetween(resolved, point) <= 25;
  }).length;
  const wider = live.filter((item) => {
    const point = geo.resolve(item.location);
    if (!point || point.kind !== "point") return false;
    return geo.milesBetween(resolved, point) <= 100;
  }).length;

  if (near) {
    hint.textContent = `${near} live role${near === 1 ? "" : "s"} within 25 miles of ${resolved.label}${remote ? `, plus ${remote} remote` : ""}.`;
    hint.dataset.tone = "ok";
  } else if (wider) {
    hint.textContent = `Nothing within 25 miles of ${resolved.label}, but ${wider} within 100 — we'll widen automatically and tell you when we do.`;
    hint.dataset.tone = "ok";
  } else {
    const metro = geo.nearestMetro(resolved);
    hint.textContent = `No roles near ${resolved.label} yet${metro ? `. Nearest hiring metro is ${metro.label}, ${Math.round(metro.miles)} miles away` : ""}${remote ? `; ${remote} remote roles are open` : ""}.`;
    hint.dataset.tone = "warn";
  }
}

document.querySelector("[data-location-input]")?.addEventListener("input", () => {
  clearTimeout(locationHintTimer);
  locationHintTimer = setTimeout(renderLocationCoverageHint, 300);
});
// Any change to where they can be, or whether they'll move, invalidates the
// cached radius search.
["[data-location-input]", "[data-relocate-input]", "[data-remote-input]",
 "[data-edit-location]", "[data-edit-relocate]", "[data-edit-remote]"].forEach((selector) => {
  document.querySelector(selector)?.addEventListener("change", invalidateLocationSearch);
  document.querySelector(selector)?.addEventListener("input", invalidateLocationSearch);
});
let locationHintTimer = null;

// Timeline filters. Changing the track resets the industry, because the
// industry list is derived from the selected track.
document.querySelector("[data-cycle-track]")?.addEventListener("change", (event) => {
  cycleFilters.track = event.target.value;
  cycleFilters.industry = "";
  renderCyclesView();
});
document.querySelector("[data-cycle-industry]")?.addEventListener("change", (event) => {
  cycleFilters.industry = event.target.value;
  renderCyclesView();
});
document.querySelector("[data-cycle-season]")?.addEventListener("change", (event) => {
  cycleFilters.season = event.target.value;
  renderCyclesView();
});
document.querySelector("[data-cycle-reset]")?.addEventListener("click", () => {
  cycleFilters.track = ""; cycleFilters.industry = ""; cycleFilters.season = "";
  cycleWindowOffset = 0;
  renderCyclesView();
});

// Timeline window navigation: ‹ › shift six months, « » shift a year.
document.querySelectorAll("[data-cycle-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    cycleWindowOffset = clampCycleOffset(cycleWindowOffset + Number(btn.dataset.cycleNav));
    renderCyclesView();
  });
});

// Double-click a month header → every company + role for that month.
document.querySelector("[data-cycle-grid]")?.addEventListener("dblclick", (event) => {
  const head = event.target.closest("[data-cycle-month]");
  if (head) openMonthDetails(Number(head.dataset.colYear), Number(head.dataset.colMonth));
});
document.querySelector("[data-month-close]")?.addEventListener("click", () => {
  document.querySelector("[data-month-modal]")?.close();
});

function openMonthDetails(year, month) {
  const dialog = document.querySelector("[data-month-modal]");
  if (!dialog) return;
  const now = new Date();
  const future = year * 12 + month > now.getUTCFullYear() * 12 + now.getUTCMonth();

  const filtered = timelinePool().filter((item) =>
    (!cycleFilters.track || item.field === cycleFilters.track) &&
    (!cycleFilters.industry || item.subField === cycleFilters.industry) &&
    (!cycleFilters.season || item.cycle === cycleFilters.season)
  );
  // One entry per company (its earliest/most relevant role that month).
  const seen = new Map();
  filtered.forEach((item) => {
    const point = observedPoint(item);
    if (!point) return;
    const hit = future ? point.month === month && point.year < year : point.year === year && point.month === month;
    if (hit && !seen.has(item.company)) seen.set(item.company, item);
  });
  const items = [...seen.values()].sort((a, b) => a.company.localeCompare(b.company));

  dialog.querySelector("[data-month-tag]").textContent = future ? "ESTIMATED" : "OBSERVED";
  dialog.querySelector("[data-month-tag]").classList.toggle("is-estimate", future);
  dialog.querySelector("[data-month-title]").textContent = `${MONTH_LABELS[month]} ${year}`;
  dialog.querySelector("[data-month-note]").textContent = future
    ? "Estimated drop window — projected from when these employers posted in the same month in prior years. Not a guarantee."
    : "What Promptly observed go live this month.";

  dialog.querySelector("[data-month-list]").innerHTML = items.length
    ? items.map((item) => {
        const logo = companyLogoUrl(item);
        const initials = esc(String(item.short || item.company.slice(0, 2)).toUpperCase().slice(0, 3));
        const fn = roleFunction(item.role);
        const dates = future
          ? "Estimated drop"
          : `Opened ${MONTH_LABELS[month]} ${year}${item.deadline && item.deadline !== "See posting" ? ` · Closes ${esc(item.deadline)}` : " · Closes: see posting"}`;
        // Keyed by listing identity, not company: a company with several roles
        // in one month would otherwise open whichever row matched first.
        return `<button class="month-row" data-open-details="${esc(alertIdentity(item))}">
            <span class="month-logo logo ${esc(item.logoClass || "")}">${logo ? `<img src="${esc(logo)}" alt="" data-short="${initials}" data-lc="${esc(item.logoClass || "")}" data-logo-img />` : initials}</span>
            <span class="month-info">
              <b>${esc(item.company)}</b>
              <span>${esc(item.role || "Student role")}</span>
              <small>${[fn, item.subField, item.cycle].filter(Boolean).map(esc).join(" · ")}</small>
              <small class="month-dates">${dates}</small>
            </span>
          </button>`;
      }).join("")
    : `<p class="empty-hint">No companies for this month with the current filters.</p>`;

  if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
}

// Remove one filter from its chip.
document.querySelector("[data-cycle-chips]")?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-cycle-remove]");
  if (!chip) return;
  const key = chip.dataset.cycleRemove;
  cycleFilters[key] = "";
  if (key === "track") cycleFilters.industry = "";
  renderCyclesView();
});

// "How this works" — the deep methodology stays available without occupying
// the interface by default.
document.querySelector("[data-cycle-info]")?.addEventListener("click", (event) => {
  const panel = document.querySelector("[data-cycle-method]");
  if (!panel) return;
  const open = panel.hidden;
  panel.hidden = !open;
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

// "+N" overflow popovers. Delegated because the grid re-renders on every
// filter change, and only one may be open at a time.
function closeCyclePopovers(except) {
  document.querySelectorAll("[data-cycle-popover]").forEach((popover) => {
    if (popover === except) return;
    popover.hidden = true;
    popover.previousElementSibling?.setAttribute?.("aria-expanded", "false");
  });
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-cycle-more]");
  if (trigger) {
    const popover = trigger.nextElementSibling;
    const willOpen = popover.hidden;
    closeCyclePopovers(popover);
    popover.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", String(willOpen));
    return;
  }
  if (!event.target.closest("[data-cycle-popover]")) closeCyclePopovers();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCyclePopovers();
});

document.querySelector("[data-interests-input]")?.addEventListener("input", scheduleFieldInference);
document.querySelector("[data-resume-input]")?.addEventListener("input", scheduleFieldInference);
document.querySelector("[data-major-input]")?.addEventListener("input", scheduleFieldInference);

document.querySelector("[data-school-input]")?.addEventListener("input", () => setAcademicError());
document.querySelector("[data-grad-year-input]")?.addEventListener("input", () => setAcademicError());
document.querySelector("[data-major-input]")?.addEventListener("input", () => setAcademicError());

document.querySelectorAll("[data-notification-pref]").forEach((input) => {
  input.addEventListener("change", () => {
    profile[input.dataset.notificationPref] = input.checked;
    saveProfile();
    saveSubscriber();
  });
});
document.addEventListener("keydown", (event) => {
  const row = event.target.closest?.(".opening-row[data-open-details]");
  if (!row || !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  openDetails(row.dataset.openDetails);
});

document.querySelector("[data-photo-input]")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    profile.photoDataUrl = String(reader.result || "");
    saveProfile();
    applyProfileToUI();
  });
  reader.readAsDataURL(file);
});

// --- Résumé upload -----------------------------------------------------------
// The file is read by resume-parser.js in this browser and never uploaded. What
// we keep is the extracted text (same field pasting has always filled), so the
// existing matching logic picks it up with no changes.
const RESUME_PRIVACY_NOTE =
  "Private by design: your résumé never leaves this device. It is read right here in your browser and only decides which alerts rise first.";

function setResumeStatus(message, tone = "") {
  const status = document.querySelector("[data-resume-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function showResumeFile(name) {
  const row = document.querySelector("[data-resume-file-row]");
  const label = document.querySelector("[data-resume-file-name]");
  if (!row || !label) return;
  if (name) {
    label.textContent = name;
    row.hidden = false;
  } else {
    row.hidden = true;
  }
}

async function handleResumeFile(file) {
  if (!file || !window.PromptlyResume) return;
  setResumeStatus(`Reading ${file.name}…`);

  const result = await window.PromptlyResume.extractResumeText(file);
  if (!result.ok) {
    showResumeFile("");
    setResumeStatus(result.reason, "error");
    // Open the paste fallback so the student has an obvious way forward.
    const paste = document.querySelector("[data-resume-paste]");
    if (paste) paste.open = true;
    return;
  }

  profile.resumeName = file.name;
  profile.resumeText = result.text;
  const textarea = document.querySelector("[data-resume-input]");
  if (textarea) textarea.value = result.text;

  // The résumé already states school, major, and graduation year. Fill those in
  // when they're blank rather than making the student retype them — but never
  // overwrite something they typed themselves.
  const filled = [];
  const education = window.PromptlyResume.detectEducation
    ? window.PromptlyResume.detectEducation(result.text)
    : {};
  const educationFields = [
    ["school", "[data-school-input]", "school"],
    ["major", "[data-major-input]", "major"],
    ["gradYear", "[data-grad-year-input]", "graduation year"],
  ];
  for (const [key, selector, label] of educationFields) {
    if (!education[key] || String(profile[key] || "").trim()) continue;
    profile[key] = education[key];
    const input = document.querySelector(selector);
    if (input) input.value = education[key];
    filled.push(label);
  }

  // Runs after the education fill so a major read off the résumé counts too.
  syncInferredFields();
  saveProfile();
  saveSubscriber();

  showResumeFile(file.name);
  const words = result.text.split(/\s+/).filter(Boolean).length;
  // Say what was auto-filled — a field that changes on its own is unnerving
  // unless you're told why, and the student may want to correct it.
  const filledNote = filled.length ? ` Filled in your ${filled.join(", ")} from it — edit if any of it is off.` : "";
  setResumeStatus(
    `Read ${words.toLocaleString()} words from ${file.name}${result.truncated ? " (first 8,000 characters used)" : ""}.${filledNote} Your matches now use it. It stayed on this device.`,
    "ok"
  );
}

document.querySelector("[data-resume-browse]")?.addEventListener("click", () => {
  document.querySelector("[data-resume-file]")?.click();
});

document.querySelector("[data-resume-file]")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) handleResumeFile(file);
  event.target.value = ""; // let the same file be re-picked after a failure
});

document.querySelector("[data-resume-clear]")?.addEventListener("click", () => {
  profile.resumeName = "";
  profile.resumeText = "";
  const textarea = document.querySelector("[data-resume-input]");
  if (textarea) textarea.value = "";
  // The résumé is gone, so the fields it alone justified have to go with it.
  syncInferredFields();
  saveProfile();
  saveSubscriber();
  showResumeFile("");
  setResumeStatus(RESUME_PRIVACY_NOTE);
});

const resumeDrop = document.querySelector("[data-resume-drop]");
if (resumeDrop) {
  resumeDrop.addEventListener("click", (event) => {
    // The whole panel is a target, but don't double-fire on the browse button.
    if (event.target.closest("[data-resume-browse]")) return;
    document.querySelector("[data-resume-file]")?.click();
  });
  ["dragenter", "dragover"].forEach((type) => {
    resumeDrop.addEventListener(type, (event) => {
      event.preventDefault();
      resumeDrop.classList.add("is-dragging");
    });
  });
  ["dragleave", "dragend"].forEach((type) => {
    resumeDrop.addEventListener(type, () => resumeDrop.classList.remove("is-dragging"));
  });
  resumeDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    resumeDrop.classList.remove("is-dragging");
    const file = event.dataTransfer?.files?.[0];
    if (file) handleResumeFile(file);
  });
}

document.querySelector(".search-panel input")?.addEventListener("input", (event) => {
  const query = event.target.value.trim();
  const q = query.toLowerCase();
  const matches = openings.filter((item) => `${item.company} ${item.role} ${item.field}`.toLowerCase().includes(q));

  // This is the exact moment the ATS-only pipeline structurally can't help:
  // a student searches a real company (Microsoft, most Fortune 500s) that has
  // no public ATS to read. Previously this dead-ended on a generic "no
  // openings match" message with no path forward. Surface watch-any-company
  // right here instead of leaving it buried at the bottom of the Alerts tab
  // where nobody hits it at the moment they'd actually want it.
  const companyMatch = query.length >= 2 && openings.some((item) => item.company.toLowerCase().includes(q));
  document.querySelector(".full-list").innerHTML = renderRows(matches) + (
    !matches.length && query.length >= 2 && !companyMatch
      ? `<div class="search-watch-prompt">
          <p><b>${esc(query)}</b> doesn't publish a job feed we can already read.</p>
          <button type="button" class="soft-action" data-search-watch-company="${esc(query)}">Watch ${esc(query)} anyway</button>
        </div>`
      : ""
  );
});

// The inline "Watch X anyway" prompt above — prefill and jump to the real
// watch-any-company flow rather than duplicating its logic.
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-search-watch-company]");
  if (!trigger) return;
  const company = trigger.dataset.searchWatchCompany || "";
  setView("alerts");
  // No rAF needed: the alerts view markup is static (toggled via a CSS class,
  // not conditionally rendered), so the inputs already exist in the DOM the
  // instant setView returns. rAF is also unreliable here — it doesn't fire
  // promptly in a backgrounded/inactive tab, which would silently drop the
  // prefill on a real device if the click coincides with a tab-visibility hit.
  const nameInput = document.querySelector("[data-watch-company]");
  const urlInput = document.querySelector("[data-watch-url]");
  if (nameInput) nameInput.value = company;
  if (urlInput) { urlInput.value = ""; urlInput.focus(); }
  document.querySelector(".watch-any-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  track("watch_prompt_from_search");
});

// --- College Autocomplete ---
function setupCollegeAutocomplete(inputSel, dropdownSel) {
  const input = document.querySelector(inputSel);
  const dropdown = document.querySelector(dropdownSel);
  if (!input || !dropdown) return;

  let ignoreBlur = false;

  function showMatches(query) {
    if (query.length < 1) { dropdown.hidden = true; return; }
    const matches = COLLEGES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 9);
    if (!matches.length) { dropdown.hidden = true; return; }
    const q = query.toLowerCase();
    dropdown.innerHTML = matches.map((c) => {
      const i = c.toLowerCase().indexOf(q);
      const highlighted = c.slice(0, i) + `<mark>${c.slice(i, i + q.length)}</mark>` + c.slice(i + q.length);
      return `<li tabindex="-1">${highlighted}</li>`;
    }).join("");
    dropdown.hidden = false;
  }

  input.addEventListener("input", () => showMatches(input.value.trim()));

  input.addEventListener("keydown", (e) => {
    if (dropdown.hidden) return;
    const items = [...dropdown.querySelectorAll("li")];
    if (e.key === "ArrowDown") { e.preventDefault(); items[0]?.focus(); }
    if (e.key === "Escape") { dropdown.hidden = true; }
  });

  dropdown.addEventListener("keydown", (e) => {
    const items = [...dropdown.querySelectorAll("li")];
    const idx = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[idx + 1]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); idx <= 0 ? input.focus() : items[idx - 1]?.focus(); }
    if (e.key === "Escape") { dropdown.hidden = true; input.focus(); }
    if (e.key === "Enter" && idx >= 0) {
      e.preventDefault();
      input.value = items[idx].textContent;
      dropdown.hidden = true;
      input.focus();
    }
  });

  dropdown.addEventListener("mousedown", () => { ignoreBlur = true; });
  dropdown.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;
    input.value = li.textContent;
    dropdown.hidden = true;
    input.focus();
    ignoreBlur = false;
  });

  input.addEventListener("blur", () => {
    if (!ignoreBlur) window.setTimeout(() => { dropdown.hidden = true; }, 80);
    ignoreBlur = false;
  });
}

setupCollegeAutocomplete("[data-school-input]", "[data-college-dropdown]");
setupCollegeAutocomplete("[data-edit-school]", "[data-college-dropdown-edit]");

// --- Alert badge (unseen = matches this profile hasn't reviewed yet) ---
// Mirrors the Alert Pulse box's seen-tracking (see markMatchingAlertsSeen):
// a brand-new profile has nothing "unseen" yet, so the badge starts at 0 and
// only grows as genuinely new matching postings arrive. It must NOT count
// every listing added platform-wide this week — that's not personalized and
// blows past 99 instantly on a fresh account.
function updateAlertBadge() {
  const stored = localStorage.getItem(seenAlertsStorageKey);
  const seen = stored ? readSeenAlerts() : null;
  const matches = matchingLiveOpenings().filter((o) => !isAwaitingLike(o));
  const count = seen ? matches.filter((item) => !seen.has(alertIdentity(item))).length : 0;
  document.querySelectorAll("[data-alert-badge]").forEach((el) => {
    el.textContent = count > 99 ? "99+" : String(count);
    el.style.display = count === 0 ? "none" : "";
  });
}
updateAlertBadge();

// --- Profile page tabs (Profile / Settings) ---
document.querySelectorAll(".profile-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const panel = tab.dataset.profileTab;
    document.querySelectorAll(".profile-tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".profile-tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.profilePanel === panel));
  });
});

registerServiceWorker();

// --- Live openings feed -----------------------------------------------------
// The curated `openings` above are the always-present baseline (the app is
// never empty). On load we pull the auto-aggregated, link-verified live feed
// from /api/openings and add any postings we don't already list, then re-render.
// If the request fails, nothing changes and the curated list still shows.
async function loadLiveOpenings() {
  try {
    const res = await fetch(`${API_BASE}/api/openings`, { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const data = await res.json();
    // Real pipeline timestamp — surfaced in the UI as proof the feed is live.
    if (data.updatedAt) {
      liveFeedUpdatedAt = data.updatedAt;
      updateTrackedCount();
    }
    const live = Array.isArray(data.openings) ? data.openings : [];
    if (!live.length) return;

    const seen = new Set(openings.map((o) => o.sourceUrl));
    let added = 0;
    for (const item of live) {
      if (!item || !item.sourceUrl || seen.has(item.sourceUrl)) continue;
      for (let i = openings.length - 1; i >= 0; i--) {
        if (openings[i].awaiting && openings[i].company.toLowerCase() === item.company.toLowerCase()) {
          openings.splice(i, 1);
        }
      }
      seen.add(item.sourceUrl);
      openings.push(item);
      added += 1;
    }
    if (!added) return;

    rebuildPlaceholders();
    migrateLegacyStatuses();
    restoreSavedCompanies();
    renderFilterChips();
    renderOpenings();
    updateAlertBadge();
    updateAlertPulse();
    if (typeof renderPeerPulse === "function") renderPeerPulse();
  } catch (err) {
    // Offline or API not configured — curated baseline already rendered.
  }
}

// Build "Awaiting posting" cards for the watch-list, then render everything.
rebuildPlaceholders();
renderFilterChips();
renderOpenings();
loadLiveOpenings();
// Swap the phone-first notification copy for this device's wording, so a
// laptop never reads "add to your Home Screen".
applyDeviceNotificationCopy();

// The search placeholder lists four employers, which a phone truncates
// mid-word ("Search Google, Goldman, I"). A cut-off example reads as a bug,
// so phones get a short version that fits.
(function shortenSearchPlaceholderOnPhones() {
  if (!isMobileDevice()) return;
  document.querySelectorAll('.search-panel input[type="search"]').forEach((input) => {
    input.placeholder = "Search companies";
  });
})();
// The tracked-company count comes from the static monitored list, so it can
// render immediately — it previously waited on a profile or the live feed and
// sat as a placeholder dash until one of those arrived.
updateTrackedCount();

// --- Analytics (first-party, aggregate, identifier-free) ------------------
// Sends an allowlisted event name only. No profile, search text, listing data,
// email, or persistent browser/session identifier is included.
function track(event) {
  try {
    const body = JSON.stringify({ event });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/stats", new Blob([body], { type: "application/json" }));
    } else {
      fetch(`${API_BASE}/api/stats`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}
track("app_open");
// Count clicks on a listing's real source link as an "application started".
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-modal-source-link]")) track("source_click");
  const statusBtn = e.target.closest("[data-status]");
  if (statusBtn) {
    const listingId = modal.dataset.listingId;
    if (listingId) setStatus(listingId, statusBtn.dataset.status);
  }
});

// --- Peer pulse (REAL numbers only — never fabricated) ----------------------
// Shows live, truthful activity so the dashboard feels alive and trustworthy.
// ── Honest tracked-count + live refresh stamp ───────────────────────────────
// Both numbers come from real data: the count is the actual number of distinct
// companies currently in the feed, and the timestamp is the pipeline's own
// updatedAt. Nothing here is estimated or padded.
function relativeTime(iso) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// "Companies tracked" means the employers Promptly actually polls every hour
// — the generated monitored.js list, which is the same number /how-it-works
// publishes. It is NOT the same as "companies with an open role right now":
// most campus boards are legitimately empty outside Sept–Nov, so that second
// number is much smaller and swings week to week. Showing one and labelling
// it as the other is the "wrong beats unknown" failure this repo forbids, so
// each has its own label.
function trackedCompanyCount() {
  return monitoredCompanies.size || new Set(
    openings.map((o) => String(o.company || "").trim().toLowerCase()).filter(Boolean)
  ).size;
}

function companiesWithOpenRoles() {
  return new Set(
    openings.filter((o) => !isAwaitingLike(o))
      .map((o) => String(o.company || "").trim().toLowerCase())
      .filter(Boolean)
  ).size;
}

function updateTrackedCount() {
  const countEl = document.querySelector("[data-tracked-count]");
  if (!countEl) return;
  countEl.textContent = String(trackedCompanyCount());

  // Say plainly how many of those actually have something open today, rather
  // than letting the headline number imply they all do.
  const openEl = document.querySelector("[data-tracked-open]");
  if (openEl) {
    const withRoles = companiesWithOpenRoles();
    openEl.textContent = `${withRoles} hiring right now`;
    openEl.hidden = withRoles === 0;
  }

  const stamp = document.querySelector("[data-tracked-refreshed]");
  if (!stamp) return;
  if (liveFeedUpdatedAt) {
    stamp.textContent = `Checked ${relativeTime(liveFeedUpdatedAt)}`;
    stamp.hidden = false;
  } else {
    stamp.hidden = true;
  }
}

async function renderPeerPulse() {
  const el = document.querySelector("[data-peer-pulse]");
  if (!el) return;
  const textEl = el.querySelector("[data-pulse-text]");
  // These two were both wrong: `watched` was openings.length — the LISTING
  // count — but rendered as "companies tracked", so the pill claimed ~568
  // companies when the real figure is the monitored registry. And `verified`
  // used o.awaiting, which live pipeline listings don't set, so it equalled
  // the same number and the pill read "568 live roles · 568 companies".
  const verified = openings.filter((o) => !isAwaitingLike(o)).length;
  const watched = trackedCompanyCount();
  const parts = [];
  // Hold the live "students on today" count until the app is popping.
  // Show real listing activity + directory size now (no fake numbers).
  try {
    const r = await fetch(`${API_BASE}/api/stats`, { headers: { Accept: "application/json" } });
    if (r.ok) {
      const s = await r.json();
      if (s.newListingsThisWeek > 0) parts.push(`${s.newListingsThisWeek} new listing${s.newListingsThisWeek > 1 ? "s" : ""} this week`);
      if (s.applicationsToday > 0) parts.push(`${s.applicationsToday} application${s.applicationsToday > 1 ? "s" : ""} started today`);
    }
  } catch {}
  parts.push(`${verified} live roles · ${watched} companies tracked`);
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  parts.push(`Updated ${today}`);
  textEl.textContent = "🔥 " + parts.join(" · ");
  el.hidden = false;
}
renderPeerPulse();

// Enter key in either watch input submits the watch.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  if (event.target.closest("[data-watch-url], [data-watch-company]")) {
    event.preventDefault();
    submitWatch();
  }
});


// Logo images: recover from a missing bundled file without an inline onerror
// attribute (those are blocked under a strict Content-Security-Policy).
// 'error' does not bubble, so listen in the capture phase.
document.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (img && img.tagName === "IMG" && img.hasAttribute("data-logo-img")) logoFallback(img);
  },
  true
);

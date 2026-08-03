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
    sourceUrl: "https://www.goldmansachs.com/careers/students/programs-and-internships/americas/2027-summer-analyst-program",
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
const browseCareers = {
  "Google": "https://www.google.com/about/careers/applications/jobs/results/?q=intern%202027",
  "Apple": "https://jobs.apple.com/en-us/search?search=intern",
  "Amazon": "https://www.amazon.jobs/en/search?base_query=2027%20intern",
  "BlackRock": "https://careers.blackrock.com/",
  "Bain & Company": "https://www.bain.com/careers/",
  "McKinsey & Company": "https://www.mckinsey.com/careers",
  "Morgan Stanley": "https://www.morganstanley.com/careers",
  "Lazard": "https://www.lazard.com/careers/",
  "Jefferies": "https://www.jefferies.com/careers/",
  "Moelis & Company": "https://www.moelis.com/careers/",
  "D.E. Shaw": "https://www.deshaw.com/careers",
  "AQR Capital Management": "https://careers.aqr.com/",
  // Stable official program landing pages (not job-ID deep links) — kept as
  // the destination but relabeled honestly (program overviews, not one req).
  "Goldman Sachs": "https://www.goldmansachs.com/careers/students/programs-and-internships/americas/2027-summer-analyst-program",
  "J.P. Morgan": "https://www.jpmorganchase.com/careers/explore-opportunities/programs/investment-banking-summer-analyst",
};
for (const item of openings) {
  const url = browseCareers[item.company];
  if (!url || item.curatedAwaiting) continue;
  item.sourceUrl = url;
  item.browse = true;
  item.sourceLabel = `${item.company} Careers — browse ${item.program || "2027"} roles`;
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
// Gives students a reason to come back (track their progress) and feeds the
// anonymous per-school pulse. Stored locally; also sent to /api/stats.
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
function setStatus(company, stage) {
  const item = findOpening(company);
  if (stage) statuses.set(company, stage); else statuses.delete(company);
  persistStatuses();
  if (stage && item) {
    try {
      fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ company, stage, school: profile.school || "", field: item.field || "" }),
      }).catch(() => {});
    } catch {}
  }
  renderStatusTracker(company);
  renderOpenings();
  refreshSavedList();
}
function statusPill(company) {
  const s = statuses.get(company);
  return s ? `<span class="row-status status-${s.toLowerCase()}">${s}</span>` : "";
}
function renderStatusTracker(company) {
  const tracker = modal.querySelector("[data-status-tracker]");
  if (!tracker) return;
  const current = statuses.get(company) || "";
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

function awaitingLine(item) {
  const status = listingStatus(item);
  if (status === "BROWSE") return `${item.company} does not publish a job feed Promptly can read, so we cannot confirm a specific opening here. This opens their official careers search.`;
  if (status === "UPCOMING") return `Applications open ${new Date(parseOpeningDate(item)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Promptly will alert you when it is live.`;
  if (status === "CLOSED") return "Applications closed. Promptly will alert you when they reopen.";
  if (isMonitored(item)) return "Awaiting the 2027 posting. Promptly is watching their job system and will alert you the moment it opens.";
  return "This employer does not publish a job feed Promptly can read, so we cannot promise an alert. Paste their careers link and we will watch it for you.";
}

function openingRow(item) {
  const match = openingMatch(item);
  const isSaved = saved.has(item.company);
  if (isAwaitingLike(item)) {
    return `
    <article class="opening-row awaiting" data-company="${esc(item.company)}" data-field="${esc(item.field)}" data-open-details="${esc(item.company)}" tabindex="0" role="button" aria-label="Track ${esc(item.company)} for 2027 postings">
      ${logoMarkup(item)}
      <div>
        <span class="status-pill">${esc(item.field)}${item.subField ? " · " + esc(item.subField) : ""}</span>${statusPill(item.company)}
        <h3>${esc(item.company)}</h3>
        <p>${listingStatus(item) === "BROWSE"
          ? `Internship roles · ${esc(item.program)}`
          : `${esc(item.role)} · ${esc(item.program)}`}</p>
        <small class="awaiting-line">${awaitingLine(item)}</small>
        ${isAwaitingLike(item) && !isMonitored(item) && listingStatus(item) === "AWAITING"
          ? `<button class="tiny-action watch-this-btn" data-watch-company-name="${esc(item.company)}" type="button">Watch ${esc(item.company)}</button>`
          : ""}
      </div>
      <div class="row-actions">
        <button class="round-btn save-btn ${isSaved ? "saved" : ""}" aria-label="${isSaved ? "Untrack" : "Track"} ${esc(item.company)}" data-save="${esc(item.company)}" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
      </div>
    </article>
  `;
  }
  return `
    <article class="opening-row" data-company="${esc(item.company)}" data-field="${esc(item.field)}" data-open-details="${esc(item.company)}" tabindex="0" role="button" aria-label="View alert details for ${esc(item.company)}">
      ${logoMarkup(item)}
      <div>
        <span class="status-pill">${esc(item.field)}</span>${statusPill(item.company)}
        <h3>${esc(item.company)}</h3>
        <p>${esc(item.role)} · ${esc(item.program)}</p>
        <small>Closes: ${esc(item.deadline)} · ${esc(item.opened)}</small>
        ${item.location ? `<small class="location-line">Location: ${esc(item.location)}</small>` : ""}
        <small class="match-line">Student fit: ${esc(match.label)}</small>
        <small class="source-line">Verified source: ${esc(item.sourceLabel || "Official careers page")}</small>
      </div>
      <div class="row-actions">
        <button class="round-btn save-btn ${isSaved ? "saved" : ""}" aria-label="${isSaved ? "Unsave" : "Save"} ${esc(item.company)}" data-save="${esc(item.company)}" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
        <button class="round-btn primary" aria-label="View alert details for ${esc(item.company)}" data-open-details-button="${esc(item.company)}">
          <svg viewBox="0 0 24 24"><path d="M8 5h11v11"/><path d="M19 5 7 17"/><path d="M5 9v10h10"/></svg>
        </button>
      </div>
    </article>
  `;
}

function preferredOpenings() {
  // real (verified) listings first, awaiting placeholders after; then by fit
  return [...openings].sort((a, b) => (isAwaitingLike(a) ? 1 : 0) - (isAwaitingLike(b) ? 1 : 0) || openingMatch(b).score - openingMatch(a).score);
}

function profileMatchText() {
  return [profile.major, profile.interests, profile.school, profile.preferredLocation, profile.fields.join(" "), profile.resumeText].join(" ").toLowerCase();
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
  return item.sourceUrl || `${item.company}|${item.role}|${item.program}`;
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

function renderOpenings(items = preferredOpenings()) {
  document.querySelector(".compact-list").innerHTML = items.slice(0, 5).map(openingRow).join("");
  document.querySelector(".full-list").innerHTML = renderRows(items);
}

function setFeatured() {
  // "Just opened" is a claim about a real posting we saw appear. Only a
  // verified live listing can carry it — never a placeholder or a careers-page
  // link, which previously headlined the home screen as if it were breaking news.
  const ranked = preferredOpenings();
  const item = ranked.find((entry) => listingStatus(entry) === "OPEN") || ranked[0];
  if (!item) return;
  const isSaved = saved.has(item.company);
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
  document.querySelector("[data-feature-details]").dataset.openDetails = item.company;
  document.querySelector("[data-feature-save]").dataset.save = item.company;
  document.querySelector("[data-feature-save]").textContent = isSaved ? "Unsave Alert" : "Save Alert";
}

function setView(name) {
  const view = document.querySelector(`#view-${name}`);
  if (!view) return;

  views.forEach((item) => item.classList.toggle("active", item === view));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  title.textContent = name === "home" ? greetingText() : view.dataset.heading;
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
function renderCyclesView() {
  const timeline = document.querySelector("#view-cycles .timeline");
  const note = document.querySelector("#view-cycles .cycle-note p");
  if (!timeline) return;
  const months = document.querySelector("#view-cycles .months");
  if (months) months.hidden = true; // grouped by cycle now, not by month

  const isMine = (cycle) => cycleMatchesProfile({ cycle });
  if (note) {
    const label = profile.gradYear ? `Class of ${profile.gradYear}` : "your profile";
    const labels = relevantCycleLabels(profile.gradYear);
    const list = labels ? labels.join(", ") : "every cycle";
    note.textContent = `Based on ${label}, Promptly highlights: ${list}. Verified openings are grouped by cycle below — yours first.`;
  }

  const live = openings.filter((o) => !isAwaitingLike(o) && o.cycle);
  const byCycle = {};
  live.forEach((o) => { (byCycle[o.cycle] = byCycle[o.cycle] || []).push(o); });

  const present = Object.keys(byCycle).sort((a, b) => {
    const am = isMine(a) ? 0 : 1, bm = isMine(b) ? 0 : 1;
    if (am !== bm) return am - bm;
    return cycleSortKey(a) - cycleSortKey(b);
  });

  if (!present.length) {
    timeline.innerHTML = `<article><p style="color:var(--muted)">No verified live openings yet — watch-list companies will appear here as their postings go live.</p></article>`;
    return;
  }

  timeline.innerHTML = present.map((cycle) => {
    const companiesSeen = new Set();
    const items = byCycle[cycle]
      .sort((a, b) => openingMatch(b).score - openingMatch(a).score)
      .filter((o) => !companiesSeen.has(o.company) && companiesSeen.add(o.company))
      .slice(0, 10);
    const mineTag = isMine(cycle) ? ` <span class="status-pill">for you</span>` : "";
    const chips = items.map((o) =>
      `<button class="company-chip" data-open-details="${esc(o.company)}">${esc(o.company)}</button>`
    ).join("");
    return `<article><strong>${esc(cycle)} · ${byCycle[cycle].length}${mineTag}</strong>${chips}</article>`;
  }).join("");
}

function findOpening(company) {
  return openings.find((opening) => opening.company.includes(company) || company.includes(opening.company.split(" ")[0])) || preferredOpenings()[0];
}

function openDetails(company) {
  const item = findOpening(company);
  track("opening_view");
  const match = openingMatch(item);
  modal.dataset.company = item.company;
  modalCompany.textContent = item.company;
  // Don't name a specific req for an employer whose feed we can't read.
  modal.querySelector("[data-modal-role]").textContent = listingStatus(item) === "BROWSE"
    ? `Internship roles · ${item.program}`
    : `${item.role} · ${item.program}`;
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
  modal.querySelector("[data-modal-source]").textContent = item.sourceLabel || "Official source";
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
  sourceLink.href = safeHttpsUrl(item.sourceUrl) || "#";
  sourceLink.hidden = !showLink;
  // Honest labeling: verified deep link vs. "browse", vs. a not-yet-open program page.
  sourceLink.textContent = status === "UPCOMING"
    ? "View the Program Page"
    : item.browse ? `Browse ${item.company} Careers` : "Open Official Posting";
  modal.querySelector("[data-save-modal]").textContent = saved.has(item.company) ? "Unsave Alert" : "Save Alert";
  const modalLogo = modal.querySelector(".modal-logo");
  const modalLogoUrl = companyLogoUrl(item);
  modalLogo.className = `modal-logo ${modalLogoUrl ? "logo-tile" : item.logoClass}`;
  modalLogo.innerHTML = modalLogoUrl
    ? `<img src="${esc(modalLogoUrl)}" alt="${esc(item.company)} logo" data-short="${esc(item.short || "")}" data-lc="${esc(item.logoClass || "")}" data-logo-img />`
    : esc(item.short);
  renderStatusTracker(item.company);
  if (typeof modal.showModal === "function") modal.showModal();
}

function saveCompany(company) {
  const item = findOpening(company);
  if (saved.has(item.company)) {
    saved.delete(item.company);
  } else {
    saved.set(item.company, item);
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
    const companies = JSON.parse(localStorage.getItem(savedStorageKey) || "[]");
    saved.clear();
    if (!Array.isArray(companies)) return;
    companies.forEach((company) => {
      const item = openings.find((opening) => opening.company === company);
      if (item) saved.set(item.company, item);
    });
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
  const inferred = inferFieldsFromText(inferenceSourceText());
  const manualOn = Array.isArray(profile.manualFieldsOn) ? profile.manualFieldsOn : [];
  const manualOff = Array.isArray(profile.manualFieldsOff) ? profile.manualFieldsOff : [];
  profile.fields = [...new Set([...inferred, ...manualOn])].filter((field) => !manualOff.includes(field));
  updateFieldButtons();
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
    const response = await fetch("/api/auth-config", { headers: { Accept: "application/json" } });
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
    const response = await fetch("/api/subscribe", {
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
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const response = await fetch("/api/vapid-public-key");
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
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    // The résumé and photo are device-only, and the form says so. The server
    // already drops them (normalizeSubscriber is an allowlist), but they must
    // not travel over the wire at all — otherwise the promise is false in
    // transit even though nothing is stored.
    const { resumeText, photoDataUrl, ...shareableProfile } = profile;
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, profile: shareableProfile }),
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
    setPushStatus("On iPhone, first add Promptly to your Home Screen (Share → Add to Home Screen), then open it from that icon to turn on alerts.");
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
    setPushStatus(
      permission === "denied"
        ? "Notifications are blocked. Fix: iPhone Settings → Notifications → Promptly → Allow Notifications. (Or remove Promptly from your Home Screen and re-add it, then tap Allow.)"
        : "Tap Allow when your phone asks, to turn on alerts."
    );
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
    const response = await fetch("/api/send-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opening: currentTestOpening(),
        profile,
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
    const response = await fetch("/api/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    setPushStatus(response.ok ? "Test sent. Check your lock screen or notification center." : "Couldn’t send the test notification. Please try again.");
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
    const response = await fetch("/api/send-recap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile,
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
      updateAccountUI();
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

  if (saveModalButton && modal.dataset.company) {
    saveCompany(modal.dataset.company);
    saveModalButton.textContent = saved.has(modal.dataset.company) ? "Unsave Alert" : "Save Alert";
  }

  if (saveButton) {
    event.preventDefault();
    event.stopPropagation();
    saveCompany(saveButton.dataset.save);
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
    openDetails(detailsButton.dataset.openDetails || detailsButton.dataset.openDetailsButton);
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
  const query = event.target.value.trim().toLowerCase();
  const matches = openings.filter((item) => `${item.company} ${item.role} ${item.field}`.toLowerCase().includes(query));
  document.querySelector(".full-list").innerHTML = renderRows(matches);
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

// --- Alert badge (recent = opened within last 7 days) ---
function recentOpenings() {
  const weekAgo = Date.now() - 7 * 86400000;
  return openings.filter((o) => {
    // Live pipeline listings carry firstSeen (stamped on the refresh run that
    // first found them) — the honest signal for "new this week".
    if (o.firstSeen) {
      const t = Date.parse(o.firstSeen);
      return Number.isFinite(t) && t >= weekAgo;
    }
    if (!o.opened) return false;
    const t = o.opened.toLowerCase();
    if (t.includes("min") || t.includes("hour")) return true;
    const m = t.match(/(\d+)\s*day/);
    return m && parseInt(m[1]) <= 7;
  });
}

function updateAlertBadge() {
  const count = recentOpenings().length;
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
    const res = await fetch("/api/openings", { headers: { Accept: "application/json" } });
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

// --- Analytics (first-party, privacy-light) --------------------------------
// Sends simple event counts so we can see what students actually do. No PII.
function getSessionId() {
  try {
    let id = localStorage.getItem("promptlySession");
    if (!id) { id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); localStorage.setItem("promptlySession", id); }
    return id;
  } catch { return "anon"; }
}
function track(event) {
  try {
    const body = JSON.stringify({ event, sessionId: getSessionId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/stats", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}
track("app_open");
// Count clicks on a listing's real source link as an "application started".
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-modal-source-link]")) track("source_click");
  const statusBtn = e.target.closest("[data-status]");
  if (statusBtn) {
    const company = modal.dataset.company;
    if (company) setStatus(company, statusBtn.dataset.status);
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

function updateTrackedCount() {
  const countEl = document.querySelector("[data-tracked-count]");
  if (!countEl) return;
  const companies = new Set(openings.map((o) => String(o.company || "").trim().toLowerCase()).filter(Boolean));
  countEl.textContent = String(companies.size);

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
  const verified = openings.filter((o) => !o.awaiting).length;
  const watched = openings.length;
  const parts = [];
  // Hold the live "students on today" count until the app is popping.
  // Show real listing activity + directory size now (no fake numbers).
  try {
    const r = await fetch("/api/stats", { headers: { Accept: "application/json" } });
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

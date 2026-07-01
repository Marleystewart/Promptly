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
  "Real Estate": ["real estate", "property", "development", "brokerage", "commercial real estate", "proptech", "urban planning"],
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
  fields: [],
  savedAlerts: [],
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

// If a logo image is missing, fall back to the colored initials tile — so a
// company without a logo file still looks intentional (never a broken icon).
function logoFallback(img) {
  const el = img.closest(".logo");
  if (!el) return;
  el.classList.remove("logo-tile");
  if (img.dataset.lc) el.classList.add(img.dataset.lc);
  el.textContent = img.dataset.short || "";
}

// Escape untrusted text before it goes into innerHTML. Live listings come
// from external ATS feeds — a job title must never be able to inject markup.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

function logoMarkup(item) {
  if (item.logo) {
    return `<div class="logo logo-tile"><img src="${esc(item.logo)}" alt="${esc(item.company)} logo" loading="lazy" data-short="${esc(item.short || "")}" data-lc="${esc(item.logoClass || "")}" onerror="logoFallback(this)" /></div>`;
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
function awaitingLine(item) {
  const status = listingStatus(item);
  if (status === "UPCOMING") return `Applications open ${new Date(parseOpeningDate(item)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Promptly will alert you when it is live.`;
  if (status === "CLOSED") return "Applications closed. Promptly will alert you when they reopen.";
  return "Awaiting the 2027 posting. Promptly will alert you the moment it opens.";
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
        <p>${esc(item.role)} · ${esc(item.program)}</p>
        <small class="awaiting-line">${awaitingLine(item)}</small>
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
  return [profile.major, profile.interests, profile.school, profile.preferredLocation, profile.fields.join(" ")].join(" ").toLowerCase();
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

  const fieldHits = (interestKeywords[item.field] || []).filter((keyword) => text.includes(keyword));
  if (fieldHits.length) {
    score += Math.min(fieldHits.length * 6, 20);
    if (!reasons.includes(item.field)) reasons.push(item.field);
  }

  if (profile.major && searchable.includes(profile.major.toLowerCase().split(" ")[0])) score += 6;
  const locationMatch = locationPreferenceMatch(item);
  score += locationMatch.score;
  if (locationMatch.reason) reasons.push(locationMatch.reason);
  score = Math.max(20, Math.min(score, 98));

  const reasonText = reasons.length ? reasons.slice(0, 2).join(" + ") : "broad profile";
  return { score, reasonText, label: `AI match ${score}% · ${reasonText}` };
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
  document.querySelector("[data-alert-profile-copy]").textContent = `${school} context, ${profile.gradYear ? `Class of ${profile.gradYear}` : "class year"}, and your interests decide which alerts rise first.`;
  document.querySelector("[data-next-window]").textContent = next.title;
  document.querySelector("[data-next-window-copy]").textContent = next.copy;
  updateAlertPulse();
}

const seenAlertsStorageKey = "promptlySeenAlerts";

function alertIdentity(item) {
  return item.sourceUrl || `${item.company}|${item.role}|${item.program}`;
}

function matchingLiveOpenings() {
  return preferredOpenings().filter((item) => {
    if (isAwaitingLike(item)) return false;
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
    return;
  }

  const seen = readSeenAlerts();
  const unseen = matches.filter((item) => !seen.has(alertIdentity(item)));
  title.textContent = unseen.length
    ? `${unseen.length} new ${unseen.length === 1 ? "match" : "matches"} since your last review.`
    : "You're caught up.";
  copy.textContent = unseen.length
    ? `Open Live Openings to review what changed across ${topFields().join(", ") || "your fields"}.`
    : `Promptly is still monitoring ${matches.length} verified matches for your profile.`;
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
  const item = preferredOpenings()[0];
  const isSaved = saved.has(item.company);
  document.querySelector("[data-feature-title]").textContent = `${item.company} ${item.role} just opened.`;
  document.querySelector("[data-feature-copy]").textContent = `${item.field} student alert · ${item.location ? `${item.location} · ` : ""}Deadline ${item.deadline}. ${item.opened}.`;
  const featureLogo = document.querySelector("[data-feature-logo]");
  featureLogo.className = `mega-logo ${item.logo ? "logo-tile" : item.logoClass}`;
  featureLogo.innerHTML = item.logo ? `<img src="${item.logo}" alt="${item.company} logo" />` : item.short;
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

  if (name === "openings") markMatchingAlertsSeen();

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

function findOpening(company) {
  return openings.find((opening) => opening.company.includes(company) || company.includes(opening.company.split(" ")[0])) || preferredOpenings()[0];
}

function openDetails(company) {
  const item = findOpening(company);
  track("opening_view");
  const match = openingMatch(item);
  const awaitingLike = isAwaitingLike(item);
  modal.dataset.company = item.company;
  modalCompany.textContent = item.company;
  modal.querySelector("[data-modal-role]").textContent = `${item.role} · ${item.program}`;
  modal.querySelector("[data-modal-why]").textContent = `Why this alert: ${match.reasonText === "broad profile" ? "It fits your broader student alert profile." : `Matched ${match.reasonText} from your profile.`}`;
  modal.querySelector("[data-modal-deadline]").textContent = item.deadline;
  const statusEl = modal.querySelector("[data-modal-status]");
  if (statusEl) {
    const st = listingStatus(item);
    statusEl.textContent = st;
    statusEl.className = `status-pill${st === "OPEN" ? "" : ` pill-${st.toLowerCase()}`}`;
  }
  modal.querySelector("[data-modal-opened]").textContent = item.opened.replace("Opened ", "");
  modal.querySelector("[data-modal-location]").textContent = item.location || "See posting";
  modal.querySelector("[data-modal-field]").textContent = item.field;
  modal.querySelector("[data-modal-source]").textContent = item.sourceLabel || "Official source";
  const sourceLink = modal.querySelector("[data-modal-source-link]");
  sourceLink.href = item.sourceUrl || "#";
  sourceLink.hidden = !item.sourceUrl || awaitingLike;
  modal.querySelector("[data-save-modal]").textContent = saved.has(item.company) ? "Unsave Alert" : "Save Alert";
  const modalLogo = modal.querySelector(".modal-logo");
  modalLogo.className = `modal-logo ${item.logo ? "logo-tile" : item.logoClass}`;
  modalLogo.innerHTML = item.logo ? `<img src="${item.logo}" alt="${item.company} logo" />` : item.short;
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

function inferFieldsFromText(value) {
  const text = String(value || "").toLowerCase();
  return fieldOptions.filter((field) => interestKeywords[field].some((keyword) => text.includes(keyword)));
}

function mergeFields(fields) {
  profile.fields = [...new Set([...profile.fields, ...fields])];
  updateFieldButtons();
}

function updateAcademicProfile() {
  profile.school = document.querySelector("[data-school-input]").value.trim();
  profile.gradYear = document.querySelector("[data-grad-year-input]").value.trim();
  profile.major = document.querySelector("[data-major-input]").value.trim();
  profile.preferredLocation = document.querySelector("[data-location-input]").value.trim();
  profile.remoteOkay = document.querySelector("[data-remote-input]").checked;
  profile.willingToRelocate = document.querySelector("[data-relocate-input]").checked;
  mergeFields(inferFieldsFromText(profile.major));
}

function saveProfile() {
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
      fields: [],
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

async function initializeAuth() {
  const authStatus = document.querySelector("[data-auth-status]");
  const callbackUrl = window.location.href;
  const oauthCallback = window.PromptlyAuthRouting.parseOAuthCallback(callbackUrl);
  if (oauthCallback) {
    const cleanUrl = window.PromptlyAuthRouting.cleanOAuthCallbackUrl(callbackUrl);
    window.history.replaceState(window.history.state, "", cleanUrl);
  }
  try {
    const response = await fetch("/api/auth-config", { headers: { Accept: "application/json" } });
    const config = response.ok ? await response.json() : { enabled: false };
    if (!config.enabled || !window.supabase?.createClient) {
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
  } catch {
    authStatus.textContent = "Account setup could not load. You can continue on this device and try again later.";
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
  localStorage.removeItem(profileStorageKey);
  localStorage.removeItem(savedStorageKey);
  localStorage.removeItem("openingPushSubscription");
  localStorage.removeItem("promptlyPendingMigrationEmail");
  sessionStorage.removeItem("promptlyMigrateLocal");
  window.location.replace(`${window.location.origin}/`);
}

async function deleteAccount() {
  const button = document.querySelector("[data-delete-account]");
  const status = document.querySelector("[data-delete-account-status]");
  const setStatus = (message) => {
    status.hidden = false;
    status.textContent = message;
  };
  if (!authClient || !authUser) return setStatus("Sign in to delete your account.");

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
    if (!response.ok) throw new Error(result.setupRequired || result.error || "Account deletion failed.");

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

function displayName() {
  return profile.name.trim() || "there";
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function greetingText() {
  return `${timeGreeting()} ${displayName()}`;
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
  document.querySelector(".watch-card span").textContent = String(36 + profile.fields.length * 8);
  document.querySelectorAll("[data-notification-pref]").forEach((input) => {
    input.checked = profile[input.dataset.notificationPref] !== false;
  });
  updateAlertIntelligence();
  setFeatured();
  renderOpenings();
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
  mergeFields(inferFieldsFromText(`${profile.major} ${profile.interests}`));
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
    fillProfileInputs();
    if (profile.resumeName) document.querySelector("[data-resume-status]").textContent = "Resume matching is coming soon. Your current matches use your major, interests, goals, and alert fields.";
    applyProfileToUI();
    setView("home");
    return true;
  } catch {
    return false;
  }
}

function enterApp() {
  const typedName = document.querySelector("[data-name-input]").value.trim();
  const typedEmail = document.querySelector("[data-email-input]").value.trim();
  const typedInterests = document.querySelector("[data-interests-input]").value.trim();
  if (!validateSignup() || !validateAcademicProfile()) return;
  if (typedName) profile.name = typedName;
  if (typedEmail) profile.email = typedEmail;
  profile.interests = typedInterests;
  mergeFields(inferFieldsFromText(typedInterests));
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

async function saveSubscriber(subscription = null) {
  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, profile }),
    });
    const data = await response.json().catch(() => ({}));
    if (data.setupRequired) setPushStatus(data.setupRequired);
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

function currentTestOpening() {
  const item = preferredOpenings()[0];
  return {
    company: item.company,
    role: item.role,
    program: item.program,
    deadline: item.deadline,
    field: item.field,
    sourceUrl: item.sourceUrl,
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
    const setup = Array.isArray(data.setupRequired) && data.setupRequired.length ? `Setup needed: ${[...new Set(data.setupRequired)].join(" ")}` : "";
    const domainIssue = uniqueErrors.some((e) => /verify a domain|own email address/i.test(e));
    if (response.ok && data.emailSent > 0) {
      setPushStatus(`Test email sent to ${profile.email}. Check your inbox and spam folder.`);
    } else if (domainIssue) {
      setPushStatus("✅ Email works — but Resend only delivers to your own inbox until you verify a domain (resend.com/domains). Verify one to reach all students.");
    } else {
      setPushStatus(data.error || setup || uniqueErrors[0] || "Test alert failed.");
    }
  } catch {
    setPushStatus("Test alert failed. Add Resend and Redis keys in Vercel, then try again.");
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
        body: `${preferredOpenings()[0].company} ${preferredOpenings()[0].role} just opened.`,
        url: preferredOpenings()[0].sourceUrl || "/",
      }),
    });
    const data = await response.json();
    setPushStatus(response.ok ? "Test sent. Check your lock screen or notification center." : data.error || "Test failed.");
  } catch {
    setPushStatus("Test failed. This works after the site is deployed on Vercel with push keys.");
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
      : data.error || data.setupRequired || "Weekly recap test failed.");
  } catch {
    setPushStatus("Weekly recap test failed. Redeploy Promptly, then try again.");
  }
}

renderFieldChoices();
updateDashboardGreeting();
rebuildPlaceholders();
restoreSavedCompanies();
renderOpenings();
setFeatured();
refreshSavedList();

if (!restoreProfile()) {
  window.setTimeout(() => setOnboardingStep(1), 1200);
}
initializeAuth();

document.addEventListener("click", async (event) => {
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
    profile.fields = profile.fields.includes(field) ? profile.fields.filter((item) => item !== field) : [...profile.fields, field];
    updateFieldButtons();
  }

  if (editFieldButton) {
    const field = editFieldButton.dataset.editFieldChoice;
    profile.fields = profile.fields.includes(field) ? profile.fields.filter((item) => item !== field) : [...profile.fields, field];
    updateFieldButtons();
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
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
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

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
  Finance: ["All Finance", "Investment Banking", "Asset Management"],
  Consulting: ["All Consulting", "MBB", "Big 4"],
};

const fieldOptions = [
  "Technology",
  "Healthcare",
  "Design",
  "Marketing",
  "Education",
  "Media",
  "Science",
  "Policy",
  "Finance",
  "Consulting",
  "Sports",
  "Startups",
];

const interestKeywords = {
  Technology: ["tech", "software", "computer", "coding", "data", "ai", "product", "cyber", "engineering", "google", "microsoft"],
  Healthcare: ["health", "hospital", "clinic", "medical", "medicine", "pre-med", "nursing", "research", "mayo", "pfizer"],
  Design: ["design", "ux", "ui", "creative", "brand", "visual", "adobe"],
  Marketing: ["marketing", "social", "growth", "brand", "advertising", "sports marketing"],
  Education: ["education", "teaching", "learning", "school", "student", "duolingo"],
  Media: ["media", "journalism", "music", "film", "news", "spotify", "content"],
  Science: ["science", "lab", "biology", "chemistry", "climate", "space", "nasa", "environment"],
  Policy: ["policy", "government", "law", "political", "public", "nonprofit", "epa", "unicef"],
  Finance: ["finance", "investment", "banking", "accounting", "money"],
  Consulting: ["consulting", "strategy", "operations", "business analyst", "mckinsey", "bain"],
  Sports: ["sports", "athletics", "team", "league"],
  Startups: ["startup", "founder", "venture", "entrepreneur"],
};

const openings = [

  // ─────────────────────────────────────────────────────────────────────────
  // EVERY entry below links to a specific job posting or dedicated program
  // page — not a generic careers homepage. Source verified Jun 26, 2026.
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
    sourceUrl: "https://careers.bcg.com/global/en/job/57657/Associate-Internship-US-Offices-US-Campus",
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
    sourceUrl: "https://jobs.us.pwc.com/job/indianapolis/audit-intern-summer-2027-destination-cpa/932/85153914320",
  },
];

const profile = {
  name: "",
  email: "",
  school: "",
  gradYear: "",
  major: "",
  interests: "",
  photoDataUrl: "",
  resumeName: "",
  fields: [],
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
const fallbackVapidPublicKey = "BIQfsqoTgEEQRYIM-YdEvr8-95V4xhNHKf9CwIRPIb3O0ZyIqABnNXUeuR-cSuoEl4wYkNptOd5aie8PU0e78o8";
const profileStorageKey = "openingProfile";

function logoMarkup(item) {
  if (item.logo) {
    return `<div class="logo logo-tile"><img src="${item.logo}" alt="${item.company} logo" loading="lazy" /></div>`;
  }
  return `<div class="logo ${item.logoClass}">${item.short}</div>`;
}

function openingRow(item) {
  const match = openingMatch(item);
  const isSaved = saved.has(item.company);
  return `
    <article class="opening-row" data-company="${item.company}" data-field="${item.field}" data-open-details="${item.company}" tabindex="0" role="button" aria-label="View alert details for ${item.company}">
      ${logoMarkup(item)}
      <div>
        <span class="status-pill">${item.field}</span>
        <h3>${item.company}</h3>
        <p>${item.role} · ${item.program}</p>
        <small>Deadline: ${item.deadline} · ${item.opened}</small>
        <small class="match-line">Student fit: ${match.label}</small>
        <small class="source-line">Verified source: ${item.sourceLabel || "Official careers page"}</small>
      </div>
      <div class="row-actions">
        <button class="round-btn save-btn ${isSaved ? "saved" : ""}" aria-label="${isSaved ? "Unsave" : "Save"} ${item.company}" data-save="${item.company}" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
        <button class="round-btn primary" aria-label="View alert details for ${item.company}" data-open-details-button="${item.company}">
          <svg viewBox="0 0 24 24"><path d="M8 5h11v11"/><path d="M19 5 7 17"/><path d="M5 9v10h10"/></svg>
        </button>
      </div>
    </article>
  `;
}

function preferredOpenings() {
  return [...openings].sort((a, b) => openingMatch(b).score - openingMatch(a).score);
}

function profileMatchText() {
  return [profile.major, profile.interests, profile.school, profile.fields.join(" ")].join(" ").toLowerCase();
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
  score = Math.min(score, 98);

  const reasonText = reasons.length ? reasons.slice(0, 2).join(" + ") : "broad profile";
  return { score, reasonText, label: `AI match ${score}% · ${reasonText}` };
}

function topFields() {
  if (profile.fields.length) return profile.fields.slice(0, 3);
  return preferredOpenings().slice(0, 3).map((item) => item.field);
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
  const resumeSignal = profile.resumeName ? " Your resume is also helping Promptly understand your experience." : "";

  document.querySelector("[data-alert-profile]").textContent = `Tracking ${fieldText} for ${major}.`;
  document.querySelector("[data-alert-profile-copy]").textContent = `${school} context, ${profile.gradYear ? `Class of ${profile.gradYear}` : "class year"}, and your interests decide which alerts rise first.${resumeSignal}`;
  document.querySelector("[data-next-window]").textContent = next.title;
  document.querySelector("[data-next-window-copy]").textContent = next.copy;
}

function renderOpenings(items = preferredOpenings()) {
  document.querySelector(".compact-list").innerHTML = items.slice(0, 5).map(openingRow).join("");
  document.querySelector(".full-list").innerHTML = items.map(openingRow).join("");
}

function setFeatured() {
  const item = preferredOpenings()[0];
  const isSaved = saved.has(item.company);
  document.querySelector("[data-feature-title]").textContent = `${item.company} ${item.role} just opened.`;
  document.querySelector("[data-feature-copy]").textContent = `${item.field} student alert · Deadline ${item.deadline}. ${item.opened}.`;
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
  const match = openingMatch(item);
  modal.dataset.company = item.company;
  modalCompany.textContent = item.company;
  modal.querySelector("[data-modal-role]").textContent = `${item.role} · ${item.program}`;
  modal.querySelector("[data-modal-why]").textContent = `Why this alert: ${match.reasonText === "broad profile" ? "It fits your broader student alert profile." : `Matched ${match.reasonText} from your profile.`}`;
  modal.querySelector("[data-modal-deadline]").textContent = item.deadline.replace(/, 20\d{2}/, "");
  modal.querySelector("[data-modal-opened]").textContent = item.opened.replace("Opened ", "");
  modal.querySelector("[data-modal-field]").textContent = item.field;
  modal.querySelector("[data-modal-source]").textContent = item.sourceLabel || "Official source";
  const sourceLink = modal.querySelector("[data-modal-source-link]");
  sourceLink.href = item.sourceUrl || "#";
  sourceLink.hidden = !item.sourceUrl;
  modal.querySelector("[data-save-modal]").textContent = saved.has(item.company) ? "Unsave Alert" : "Save Alert";
  const modalLogo = modal.querySelector(".modal-logo");
  modalLogo.className = `modal-logo ${item.logo ? "logo-tile" : item.logoClass}`;
  modalLogo.innerHTML = item.logo ? `<img src="${item.logo}" alt="${item.company} logo" />` : item.short;
  if (typeof modal.showModal === "function") modal.showModal();
}

function saveCompany(company) {
  const item = findOpening(company);
  if (saved.has(item.company)) {
    saved.delete(item.company);
  } else {
    saved.set(item.company, item);
  }
  renderOpenings();
  setFeatured();
  refreshSavedList();
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
  mergeFields(inferFieldsFromText(profile.major));
}

function saveProfile() {
  localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

function isValidEmail(value) {
  const email = value.trim().toLowerCase();
  const basicShape = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!basicShape) return false;

  const domain = email.split("@").pop();
  const acceptedDomains = ["gmail.com", "yahoo.com", "icloud.com", "outlook.com", "hotmail.com", "aol.com"];
  return acceptedDomains.includes(domain) || domain.endsWith(".edu");
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
    setSignupError("Use a real email like name@gmail.com, name@yahoo.com, or your school .edu email.");
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
  updateDashboardGreeting();
  updateProfilePhoto();
  document.querySelector("[data-profile-school]").textContent = profile.school || "Not set";
  document.querySelector("[data-profile-year]").textContent = profile.gradYear || "Not set";
  document.querySelector("[data-profile-major]").textContent = profile.major || "Undecided";
  document.querySelector("[data-profile-interests]").textContent = profile.interests || "Not set";
  document.querySelector("[data-profile-fields]").textContent = profile.fields.length ? profile.fields.join(", ") : "All fields";
  document.querySelector("[data-home-school]").textContent = profile.school || "Your school";
  document.querySelector("[data-home-year]").textContent = profile.gradYear ? `Class of ${profile.gradYear}` : "Graduation year";
  document.querySelector("[data-home-major]").textContent = profile.major || "Your major";
  document.querySelector(".watch-card span").textContent = String(36 + profile.fields.length * 8);
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
  document.querySelector("[data-edit-school]").value = profile.school || "";
  document.querySelector("[data-edit-year]").value = profile.gradYear || "";
  document.querySelector("[data-edit-major]").value = profile.major || "";
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
  profile.interests = document.querySelector("[data-edit-interests]").value.trim();
  document.querySelector("[data-name-input]").value = profile.name;
  document.querySelector("[data-email-input]").value = profile.email;
  document.querySelector("[data-school-input]").value = profile.school;
  document.querySelector("[data-grad-year-input]").value = profile.gradYear;
  document.querySelector("[data-major-input]").value = profile.major;
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
    document.querySelector("[data-name-input]").value = profile.name || "";
    document.querySelector("[data-email-input]").value = profile.email || "";
    document.querySelector("[data-school-input]").value = profile.school || "";
    document.querySelector("[data-grad-year-input]").value = profile.gradYear || "";
    document.querySelector("[data-major-input]").value = profile.major || "";
    document.querySelector("[data-interests-input]").value = profile.interests || "";
    if (profile.resumeName) document.querySelector("[data-resume-status]").textContent = `${profile.resumeName} added. Promptly will use it only to improve matches and recruiting timeline signals.`;
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
  if (!("Notification" in window) || !("PushManager" in window)) {
    setPushStatus("Push alerts are not supported here. On iPhone, add the site to Home Screen first.");
    return;
  }

  const registration = await registerServiceWorker();
  if (!registration) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    setPushStatus("Notifications are off. Turn them on to receive opening alerts.");
    return;
  }

  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(await getVapidPublicKey()),
  });

  localStorage.setItem("openingPushSubscription", JSON.stringify(subscription));
  setPushStatus("Alerts are enabled. Tap Send Test to check your phone notification.");

  await saveSubscriber(subscription);
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
    const setup = Array.isArray(data.setupRequired) && data.setupRequired.length ? `Setup needed: ${data.setupRequired.join(" ")}` : "";
    const errors = Array.isArray(data.errors) && data.errors.length ? data.errors.join(" ") : "";
    const sentCount = (data.emailSent || 0) + (data.pushSent || 0);
    if (response.ok && sentCount > 0) {
      setPushStatus(`Test sent to ${data.emailSent || 0} email inbox and ${data.pushSent || 0} phone.`);
    } else {
      setPushStatus(data.error || setup || errors || "Test alert failed.");
    }
  } catch {
    setPushStatus("Test alert failed. Add Resend and Redis keys in Vercel, then try again.");
  }
}

async function sendTestPush() {
  let raw = localStorage.getItem("openingPushSubscription");
  if (!raw) {
    setPushStatus("Setting up phone alerts first. Tap Allow if your device asks.");
    await enablePushAlerts();
    raw = localStorage.getItem("openingPushSubscription");
    if (!raw) {
      setPushStatus("Phone alerts are not enabled yet. On iPhone, open Promptly from the Home Screen app icon, then tap Enable Phone Notifications.");
      return;
    }
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
      }),
    });
    const data = await response.json();
    setPushStatus(response.ok ? "Test sent. Check your lock screen or notification center." : data.error || "Test failed.");
  } catch {
    setPushStatus("Test failed. This works after the site is deployed on Vercel with push keys.");
  }
}

renderFieldChoices();
updateDashboardGreeting();
renderOpenings();
setFeatured();

if (!restoreProfile()) {
  window.setTimeout(() => setOnboardingStep(1), 1200);
}

document.addEventListener("click", (event) => {
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
  const saveModalButton = event.target.closest("[data-save-modal]");
  const resetDemoButton = event.target.closest("[data-reset-demo]");
  const photoButton = event.target.closest("[data-photo-button]");
  const resumeButton = event.target.closest("[data-resume-button]");
  const editProfileButton = event.target.closest("[data-edit-profile]");
  const saveProfileButton = event.target.closest("[data-save-profile-edits]");
  const closeProfileButton = event.target.closest("[data-close-profile-modal]");

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
    localStorage.removeItem(profileStorageKey);
    localStorage.removeItem("openingPushSubscription");
    window.location.reload();
  }

  if (photoButton) {
    document.querySelector("[data-photo-input]").click();
  }

  if (resumeButton) {
    document.querySelector("[data-resume-input]").click();
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

    const list = field === "All" ? preferredOpenings() : field === "Saved" ? [...saved.values()] : openings.filter((item) => item.field === field);
    const target = inSearchPanel ? document.querySelector(".full-list") : document.querySelector(".compact-list");
    target.innerHTML = list.map(openingRow).join("");
  }

  const subFilterChip = event.target.closest("[data-sub-field]");
  if (subFilterChip) {
    document.querySelectorAll(".sub-filter-chip").forEach((btn) => btn.classList.remove("active"));
    subFilterChip.classList.add("active");
    const subField = subFilterChip.dataset.subField;
    const activeMain = document.querySelector(".search-panel .filter-chip.active");
    const field = activeMain ? activeMain.textContent.trim() : "";
    const list = subField.startsWith("All ")
      ? openings.filter((item) => item.field === field)
      : openings.filter((item) => item.field === field && item.subField === subField);
    document.querySelector(".full-list").innerHTML = list.map(openingRow).join("");
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

document.querySelector("[data-resume-input]")?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  profile.resumeName = file.name;
  document.querySelector("[data-resume-status]").textContent = `${file.name} added. Promptly will use it only to improve matches and recruiting timeline signals.`;
  saveProfile();
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
  document.querySelector(".full-list").innerHTML = matches.map(openingRow).join("");
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
  return openings.filter((o) => {
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

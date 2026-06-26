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
  {
    company: "Google",
    short: "GO",
    logoClass: "tech",
    logo: "assets/logos/google.webp",
    field: "Technology",
    role: "Associate Product Manager",
    program: "Summer 2027",
    deadline: "Aug 28, 2026",
    opened: "Opened today",
    sourceLabel: "Google Careers",
    sourceUrl: "https://www.google.com/about/careers/applications/students/",
  },
  {
    company: "Microsoft",
    short: "MS",
    logoClass: "tech",
    logo: "assets/logos/microsoft.jpeg",
    field: "Technology",
    role: "Explore Program Intern",
    program: "Summer 2027",
    deadline: "Sep 4, 2026",
    opened: "Opened today",
    sourceLabel: "Microsoft Students",
    sourceUrl: "https://careers.microsoft.com/students/us/en",
  },
  {
    company: "Mayo Clinic",
    short: "Mayo",
    logoClass: "health",
    logo: "assets/logos/mayo-clinic.jpeg",
    field: "Healthcare",
    role: "Clinical Research Intern",
    program: "Summer 2027",
    deadline: "Sep 18, 2026",
    opened: "Opened 1 hr ago",
    sourceLabel: "Mayo Clinic Jobs",
    sourceUrl: "https://jobs.mayoclinic.org/",
  },
  {
    company: "Pfizer",
    short: "PFE",
    logoClass: "health",
    logo: "assets/logos/pfizer.png",
    field: "Healthcare",
    role: "Biopharma Strategy Intern",
    program: "Summer 2027",
    deadline: "Sep 30, 2026",
    opened: "Opened 90 min ago",
    sourceLabel: "Pfizer Careers",
    sourceUrl: "https://www.pfizer.com/about/careers",
  },
  {
    company: "Spotify",
    short: "SP",
    logoClass: "media",
    logo: "assets/logos/spotify.jpeg",
    field: "Marketing",
    role: "Music Marketing Intern",
    program: "Summer 2027",
    deadline: "Sep 25, 2026",
    opened: "Opened 2 hrs ago",
    sourceLabel: "Life at Spotify",
    sourceUrl: "https://www.lifeatspotify.com/jobs",
  },
  {
    company: "NASA",
    short: "NASA",
    logoClass: "science",
    logo: "assets/logos/nasa.jpeg",
    field: "Science",
    role: "Mission Systems Intern",
    program: "Spring 2027",
    deadline: "Jul 31, 2026",
    opened: "Opened yesterday",
    sourceLabel: "NASA Internships",
    sourceUrl: "https://intern.nasa.gov/",
  },
  {
    company: "Duolingo",
    short: "Duo",
    logoClass: "education",
    field: "Education",
    role: "Learning Product Intern",
    program: "Summer 2027",
    deadline: "Oct 9, 2026",
    opened: "Opened yesterday",
    sourceLabel: "Duolingo Careers",
    sourceUrl: "https://careers.duolingo.com/",
  },
  {
    company: "New York Times",
    short: "NYT",
    logoClass: "media",
    field: "Media",
    role: "Newsroom Fellowship",
    program: "Summer 2027",
    deadline: "Oct 16, 2026",
    opened: "Opened 3 days ago",
    sourceLabel: "NYT Careers",
    sourceUrl: "https://www.nytco.com/careers/",
  },
  {
    company: "EPA",
    short: "EPA",
    logoClass: "policy",
    logo: "assets/logos/epa.jpeg",
    field: "Policy",
    role: "Environmental Policy Intern",
    program: "Spring 2027",
    deadline: "Aug 14, 2026",
    opened: "Opened 4 days ago",
    sourceLabel: "EPA Careers",
    sourceUrl: "https://www.epa.gov/careers",
  },
  {
    company: "UNICEF",
    short: "UN",
    logoClass: "policy",
    logo: "assets/logos/unicef.jpeg",
    field: "Policy",
    role: "Programs & Partnerships Intern",
    program: "Summer 2027",
    deadline: "Oct 21, 2026",
    opened: "Opened 4 days ago",
    sourceLabel: "UNICEF Jobs",
    sourceUrl: "https://jobs.unicef.org/",
  },
  {
    company: "Adobe",
    short: "AD",
    logoClass: "tech",
    logo: "assets/logos/adobe.png",
    field: "Design",
    role: "Product Design Intern",
    program: "Summer 2027",
    deadline: "Sep 6, 2026",
    opened: "Opened 5 days ago",
    sourceLabel: "Adobe University",
    sourceUrl: "https://www.adobe.com/careers/university.html",
  },
  {
    company: "Goldman Sachs",
    short: "GS",
    logoClass: "gs",
    logo: "assets/logos/goldman-sachs.png",
    field: "Finance",
    role: "Investment Banking",
    program: "Summer 2027",
    deadline: "Jul 12, 2026",
    opened: "Opened 6 days ago",
    sourceLabel: "Goldman Sachs Students",
    sourceUrl: "https://www.goldmansachs.com/careers/students/",
  },
  {
    company: "JPMorgan",
    short: "JPM",
    logoClass: "gs",
    logo: "assets/logos/jpmorgan.png",
    field: "Finance",
    role: "Markets Summer Analyst",
    program: "Summer 2027",
    deadline: "Jul 19, 2026",
    opened: "Opened 1 week ago",
    sourceLabel: "JPMorgan Students",
    sourceUrl: "https://careers.jpmorgan.com/us/en/students",
  },
  {
    company: "McKinsey & Company",
    short: "McK",
    logoClass: "mck",
    logo: "assets/logos/mckinsey.png",
    field: "Consulting",
    role: "Business Analyst",
    program: "Summer 2027",
    deadline: "Aug 2, 2026",
    opened: "Opened 1 week ago",
    sourceLabel: "McKinsey Students",
    sourceUrl: "https://www.mckinsey.com/careers/students",
  },
  {
    company: "Bain & Company",
    short: "Bain",
    logoClass: "bain",
    logo: "assets/logos/bain.webp",
    field: "Consulting",
    role: "Associate Consultant Intern",
    program: "Summer 2027",
    deadline: "Aug 9, 2026",
    opened: "Opened 1 week ago",
    sourceLabel: "Bain Internships",
    sourceUrl: "https://www.bain.com/careers/work-with-us/internships-programs/",
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
  return `
    <article class="opening-row" data-company="${item.company}" data-field="${item.field}">
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
        <button class="round-btn" aria-label="Save ${item.company}" data-save="${item.company}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
        <button class="round-btn primary" aria-label="View alert details for ${item.company}" data-open-details="${item.company}">
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

  document.querySelector("[data-alert-profile]").textContent = `Tracking ${fieldText} for ${major}.`;
  document.querySelector("[data-alert-profile-copy]").textContent = `${school} context, ${profile.gradYear ? `Class of ${profile.gradYear}` : "class year"}, and your interests decide which alerts rise first.`;
  document.querySelector("[data-next-window]").textContent = next.title;
  document.querySelector("[data-next-window-copy]").textContent = next.copy;
}

function renderOpenings(items = preferredOpenings()) {
  document.querySelector(".compact-list").innerHTML = items.slice(0, 5).map(openingRow).join("");
  document.querySelector(".full-list").innerHTML = items.map(openingRow).join("");
}

function setFeatured() {
  const item = preferredOpenings()[0];
  document.querySelector("[data-feature-title]").textContent = `${item.company} ${item.role} just opened.`;
  document.querySelector("[data-feature-copy]").textContent = `${item.field} student alert · Deadline ${item.deadline}. ${item.opened}.`;
  const featureLogo = document.querySelector("[data-feature-logo]");
  featureLogo.className = `mega-logo ${item.logo ? "logo-tile" : item.logoClass}`;
  featureLogo.innerHTML = item.logo ? `<img src="${item.logo}" alt="${item.company} logo" />` : item.short;
  document.querySelector("[data-feature-details]").dataset.openDetails = item.company;
  document.querySelector("[data-feature-save]").dataset.save = item.company;
}

function setView(name) {
  const view = document.querySelector(`#view-${name}`);
  if (!view) return;

  views.forEach((item) => item.classList.toggle("active", item === view));
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  title.textContent = name === "home" ? greetingText() : view.dataset.heading;
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  const modalLogo = modal.querySelector(".modal-logo");
  modalLogo.className = `modal-logo ${item.logo ? "logo-tile" : item.logoClass}`;
  modalLogo.innerHTML = item.logo ? `<img src="${item.logo}" alt="${item.company} logo" />` : item.short;
  if (typeof modal.showModal === "function") modal.showModal();
}

function saveCompany(company) {
  const item = findOpening(company);
  saved.set(item.company, item);
  emptyState.hidden = saved.size > 0;
  savedList.innerHTML = [...saved.values()].map(openingRow).join("");
  setView("saved");
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

function greetingText() {
  return `Good Morning ${displayName()}`;
}

function applyProfileToUI() {
  document.body.classList.remove("onboarding-active", "launch-active");
  document.querySelector("[data-title]").textContent = greetingText();
  document.querySelector("#view-home").dataset.heading = greetingText();
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
  const raw = localStorage.getItem("openingPushSubscription");
  if (!raw) {
    setPushStatus("Enable alerts first, then send a test notification.");
    return;
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
  const detailsButton = event.target.closest("[data-open-details]");
  const saveButton = event.target.closest("[data-save]");
  const filterButton = event.target.closest(".filter-chip");
  const closeButton = event.target.closest(".close-modal");
  const enablePushButton = event.target.closest("[data-enable-push]");
  const sendTestButton = event.target.closest("[data-send-test-push]");
  const sendTestAlertButton = event.target.closest("[data-send-test-alert]");
  const saveModalButton = event.target.closest("[data-save-modal]");
  const resetDemoButton = event.target.closest("[data-reset-demo]");
  const photoButton = event.target.closest("[data-photo-button]");
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

  if (resetDemoButton) {
    localStorage.removeItem(profileStorageKey);
    localStorage.removeItem("openingPushSubscription");
    window.location.reload();
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
    openDetails(detailsButton.dataset.openDetails);
  }

  if (saveButton) {
    saveCompany(saveButton.dataset.save);
  }

  if (filterButton) {
    const field = filterButton.textContent.trim();
    filterButton.parentElement.querySelectorAll(".filter-chip").forEach((button) => button.classList.remove("active"));
    filterButton.classList.add("active");
    const list = field === "All" ? preferredOpenings() : field === "Saved" ? [...saved.values()] : openings.filter((item) => item.field === field);
    const target = filterButton.closest(".search-panel") ? document.querySelector(".full-list") : document.querySelector(".compact-list");
    target.innerHTML = list.map(openingRow).join("");
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

registerServiceWorker();

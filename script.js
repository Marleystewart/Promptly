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
  Healthcare: ["health", "hospital", "clinic", "medical", "medicine", "pre-med", "nursing", "research", "mayo"],
  Design: ["design", "ux", "ui", "creative", "brand", "visual", "adobe"],
  Marketing: ["marketing", "social", "growth", "brand", "advertising", "sports marketing"],
  Education: ["education", "teaching", "learning", "school", "student", "duolingo"],
  Media: ["media", "journalism", "music", "film", "news", "spotify", "content"],
  Science: ["science", "lab", "biology", "chemistry", "climate", "space", "nasa", "environment"],
  Policy: ["policy", "government", "law", "political", "public", "nonprofit", "epa"],
  Finance: ["finance", "investment", "banking", "accounting", "money"],
  Consulting: ["consulting", "strategy", "operations", "business analyst"],
  Sports: ["sports", "athletics", "team", "league"],
  Startups: ["startup", "founder", "venture", "entrepreneur"],
};

const openings = [
  {
    company: "Google",
    short: "GO",
    logoClass: "tech",
    field: "Technology",
    role: "Associate Product Manager",
    program: "Summer 2026",
    deadline: "Nov 4, 2025",
    opened: "Opened 18 min ago",
  },
  {
    company: "Mayo Clinic",
    short: "Mayo",
    logoClass: "health",
    field: "Healthcare",
    role: "Clinical Research Intern",
    program: "Summer 2026",
    deadline: "Oct 22, 2025",
    opened: "Opened 1 hr ago",
  },
  {
    company: "Spotify",
    short: "SP",
    logoClass: "media",
    field: "Marketing",
    role: "Music Marketing Intern",
    program: "Summer 2026",
    deadline: "Nov 1, 2025",
    opened: "Opened 2 hrs ago",
  },
  {
    company: "NASA",
    short: "NASA",
    logoClass: "science",
    field: "Science",
    role: "Mission Systems Intern",
    program: "Summer 2026",
    deadline: "Oct 30, 2025",
    opened: "Opened yesterday",
  },
  {
    company: "Duolingo",
    short: "Duo",
    logoClass: "education",
    field: "Education",
    role: "Learning Product Intern",
    program: "Summer 2026",
    deadline: "Nov 8, 2025",
    opened: "Opened yesterday",
  },
  {
    company: "New York Times",
    short: "NYT",
    logoClass: "media",
    field: "Media",
    role: "Newsroom Fellowship",
    program: "Summer 2026",
    deadline: "Oct 28, 2025",
    opened: "Opened 3 days ago",
  },
  {
    company: "EPA",
    short: "EPA",
    logoClass: "policy",
    field: "Policy",
    role: "Environmental Policy Intern",
    program: "Summer 2026",
    deadline: "Nov 12, 2025",
    opened: "Opened 4 days ago",
  },
  {
    company: "Adobe",
    short: "AD",
    logoClass: "tech",
    field: "Design",
    role: "Product Design Intern",
    program: "Summer 2026",
    deadline: "Oct 24, 2025",
    opened: "Opened 5 days ago",
  },
  {
    company: "Goldman Sachs",
    short: "GS",
    logoClass: "gs",
    field: "Finance",
    role: "Investment Banking",
    program: "Summer 2026",
    deadline: "Oct 15, 2025",
    opened: "Opened 6 days ago",
  },
  {
    company: "McKinsey & Company",
    short: "McK",
    logoClass: "mck",
    field: "Consulting",
    role: "Business Analyst",
    program: "Summer 2026",
    deadline: "Oct 12, 2025",
    opened: "Opened 1 week ago",
  },
];

const profile = {
  name: "",
  email: "",
  school: "",
  gradYear: "",
  major: "",
  interests: "",
  fields: [],
};

const views = document.querySelectorAll(".view");
const title = document.querySelector("[data-title]");
const modal = document.querySelector(".details-modal");
const modalCompany = document.querySelector("[data-modal-company]");
const savedList = document.querySelector(".saved-list");
const emptyState = document.querySelector(".empty-state");
const fieldGrid = document.querySelector("[data-field-grid]");
const pushStatus = document.querySelector("[data-push-status]");
const saved = new Map();
const fallbackVapidPublicKey = "BIQfsqoTgEEQRYIM-YdEvr8-95V4xhNHKf9CwIRPIb3O0ZyIqABnNXUeuR-cSuoEl4wYkNptOd5aie8PU0e78o8";
const profileStorageKey = "openingProfile";

function logoMarkup(item) {
  return `<div class="logo ${item.logoClass}">${item.short}</div>`;
}

function openingRow(item) {
  return `
    <article class="opening-row" data-company="${item.company}" data-field="${item.field}">
      ${logoMarkup(item)}
      <div>
        <span class="status-pill">${item.field}</span>
        <h3>${item.company}</h3>
        <p>${item.role} · ${item.program}</p>
        <small>Deadline: ${item.deadline} · ${item.opened}</small>
      </div>
      <div class="row-actions">
        <button class="round-btn" aria-label="Save ${item.company}" data-save="${item.company}">
          <svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>
        </button>
        <button class="round-btn primary" aria-label="Open ${item.company}" data-open-details="${item.company}">
          <svg viewBox="0 0 24 24"><path d="M8 5h11v11"/><path d="M19 5 7 17"/><path d="M5 9v10h10"/></svg>
        </button>
      </div>
    </article>
  `;
}

function preferredOpenings() {
  const matches = openings.filter((item) => profile.fields.includes(item.field));
  return matches.length ? matches : openings;
}

function renderOpenings(items = preferredOpenings()) {
  document.querySelector(".compact-list").innerHTML = items.slice(0, 5).map(openingRow).join("");
  document.querySelector(".full-list").innerHTML = items.map(openingRow).join("");
}

function setFeatured() {
  const item = preferredOpenings()[0];
  document.querySelector("[data-feature-title]").textContent = `${item.company} ${item.role} just opened.`;
  document.querySelector("[data-feature-copy]").textContent = `${item.field} · Deadline ${item.deadline}. ${item.opened}.`;
  document.querySelector("[data-feature-logo]").className = `mega-logo ${item.logoClass}`;
  document.querySelector("[data-feature-logo]").textContent = item.short;
  document.querySelector("[data-feature-open]").dataset.openDetails = item.company;
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
  modalCompany.textContent = item.company;
  modal.querySelector("[data-modal-role]").textContent = `${item.role} · ${item.program}`;
  modal.querySelector("[data-modal-deadline]").textContent = item.deadline.replace(", 2025", "");
  modal.querySelector("[data-modal-opened]").textContent = item.opened.replace("Opened ", "");
  modal.querySelector("[data-modal-field]").textContent = item.field;
  modal.querySelector(".modal-logo").className = `modal-logo ${item.logoClass}`;
  modal.querySelector(".modal-logo").textContent = item.short;
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
  updateFieldButtons();
}

function updateFieldButtons() {
  document.querySelectorAll("[data-field-choice]").forEach((button) => {
    button.classList.toggle("active", profile.fields.includes(button.dataset.fieldChoice));
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
  document.querySelector(".profile-chip").textContent = profile.name.trim()[0]?.toUpperCase() || "P";
  document.querySelector("[data-profile-school]").textContent = profile.school || "Not set";
  document.querySelector("[data-profile-year]").textContent = profile.gradYear || "Not set";
  document.querySelector("[data-profile-major]").textContent = profile.major || "Undecided";
  document.querySelector("[data-profile-interests]").textContent = profile.interests || "Not set";
  document.querySelector("[data-profile-fields]").textContent = profile.fields.length ? profile.fields.join(", ") : "All fields";
  document.querySelector(".watch-card span").textContent = String(36 + profile.fields.length * 8);
  setFeatured();
  renderOpenings();
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
  const finishButton = event.target.closest("[data-finish-onboarding]");
  const viewButton = event.target.closest("[data-view]");
  const detailsButton = event.target.closest("[data-open-details]");
  const saveButton = event.target.closest("[data-save]");
  const filterButton = event.target.closest(".filter-chip");
  const closeButton = event.target.closest(".close-modal");
  const enablePushButton = event.target.closest("[data-enable-push]");
  const sendTestButton = event.target.closest("[data-send-test-push]");
  const sendTestAlertButton = event.target.closest("[data-send-test-alert]");
  const resetDemoButton = event.target.closest("[data-reset-demo]");

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

  if (resetDemoButton) {
    localStorage.removeItem(profileStorageKey);
    localStorage.removeItem("openingPushSubscription");
    window.location.reload();
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

document.querySelector(".search-panel input")?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  const matches = openings.filter((item) => `${item.company} ${item.role} ${item.field}`.toLowerCase().includes(query));
  document.querySelector(".full-list").innerHTML = matches.map(openingRow).join("");
});

registerServiceWorker();

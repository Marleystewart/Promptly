// ─────────────────────────────────────────────────────────────────────────
// Is this address a university one? Shared by the browser and the server
// (loaded as a <script> and require()d by Node — see the shim at the bottom),
// so there is exactly ONE definition of what counts as a student address.
//
// What this is for: Promptly is a student product, but a hard .edu requirement
// would lock out students whose only address is a personal Gmail — plenty of
// people apply to internships from one. So a .edu address does not gate signup;
// it marks the account as institutionally confirmed, which is a real signal
// worth having when talking to schools or employers later.
//
// What this deliberately does NOT claim: that a non-.edu user is not a student,
// or that a .edu holder is currently enrolled (alumni keep addresses for
// years). It says only "this address belongs to a recognised institution".
// ─────────────────────────────────────────────────────────────────────────
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.PromptlyStudentEmail = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // US institutions are ".edu". Most other countries use a second-level
  // academic label under their country code — ".edu.au", ".ac.uk", ".edu.sg".
  // Matching the shape rather than keeping a list of universities means a new
  // school works on day one without a code change.
  const ACADEMIC_SUFFIX = /\.(edu|ac)(\.[a-z]{2})?$/i;

  // Free mailbox providers that happen to end in a matching string would be a
  // false positive if any ever existed; kept explicit so the intent is visible.
  const NEVER_ACADEMIC = new Set([
    "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com",
    "yahoo.com", "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  ]);

  function domainOf(email) {
    const at = String(email || "").trim().toLowerCase().lastIndexOf("@");
    if (at < 1) return "";
    return String(email).trim().toLowerCase().slice(at + 1);
  }

  // True only for a well-formed address at a recognised academic domain.
  function isStudentEmail(email) {
    const domain = domainOf(email);
    if (!domain || domain.indexOf(".") < 1) return false;
    if (NEVER_ACADEMIC.has(domain)) return false;
    return ACADEMIC_SUFFIX.test(domain);
  }

  // The institution's domain, for display ("trinity.edu"). Empty when the
  // address is not academic — never guess an institution from a personal inbox.
  function institutionDomain(email) {
    return isStudentEmail(email) ? domainOf(email) : "";
  }

  // One place that decides what the account gets labelled as, so the badge,
  // the stored record and any future school reporting cannot disagree.
  function studentStatus(email) {
    return isStudentEmail(email)
      ? { verified: true, source: "edu-domain", domain: domainOf(email) }
      : { verified: false, source: null, domain: "" };
  }

  return { isStudentEmail, institutionDomain, studentStatus, domainOf, ACADEMIC_SUFFIX };
}));

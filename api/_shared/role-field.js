// Categorize an internship by what the ROLE actually is, not only by the
// employer's industry. A software-engineering role at a bank belongs under
// Technology; a mechanical-engineering role at an automaker belongs under
// Engineering. This is what lets a CS student find the SWE role a bank posts.
//
// Deliberately conservative: only a STRONG, unambiguous title signal overrides
// the employer's curated field. Anything vague keeps the company's field, which
// is the reliable default. Order matters — first match wins, so the most
// specific patterns are listed first.
//
// Fields/subFields returned here MUST exist in script.js's FIELD_ORDER and
// TRACK_DIVISIONS, or the reclassified role lands on a filter that isn't shown.

const RULES = [
  // ── Engineering (physical / hardware disciplines) ────────────────────────
  { field: "Engineering", subField: "Aerospace & Defense", re: /\b(aerospace|aeronautic|astronautic|avionics|propulsion|defense)\b.*\bengineer|\bengineer.*\b(aerospace|avionics|propulsion)\b/i },
  { field: "Engineering", subField: "Automotive", re: /\b(automotive|vehicle|powertrain|autonomous vehicle)\b.*\bengineer/i },
  { field: "Engineering", subField: "Robotics", re: /\b(robotics|mechatronic|controls)\s+engineer|\brobotics intern/i },
  { field: "Engineering", subField: "Manufacturing", re: /\b(mechanical|manufacturing|industrial|civil|chemical|biomedical|materials|structural|process)\s+engineer(ing)?\b/i },
  { field: "Engineering", subField: "Energy", re: /\b(energy|power systems|petroleum|renewable)\s+engineer/i },
  { field: "Engineering", subField: "Semiconductors", re: /\b(electrical|hardware|asic|fpga|rf|analog|chip|semiconductor|silicon|vlsi)\s+(engineer|design)/i },

  // ── Technology (software / data / security / infra) ──────────────────────
  { field: "Technology", subField: "AI / ML", re: /machine learning|deep learning|\bml\b|\bai\b|artificial intelligence|\bnlp\b|computer vision|\bml engineer|\bai engineer|data scien(ce|tist)/i },
  { field: "Technology", subField: "Data", re: /data engineer|analytics engineer|\bdata engineering\b/i },
  { field: "Technology", subField: "Security", re: /cyber ?security|information security|infosec|security engineer|penetration test|application security|appsec/i },
  { field: "Technology", subField: "Cloud & Infrastructure", re: /\bcloud (engineer|infrastructure)|devops|site reliability|\bsre\b|infrastructure engineer|platform engineer|systems engineer|network engineer|kubernetes/i },
  // "developer" alone is a software signal EXCEPT "business developer/development"
  // (that's sales). Banks label their tech track "Engineering (Developer)".
  { field: "Technology", subField: "Software Engineering", re: /(software|full[- ]?stack|back[- ]?end|front[- ]?end|mobile|\bios\b|android|web|embedded)\s+(engineer|developer|dev)\b|\bsoftware engineering\b|\bswe\b|\(developer\)|(?<!business )\bdeveloper\b/i },
];

// Returns { field, subField } to override with, or null to keep the employer's.
function classifyRoleField(title) {
  const t = String(title || "");
  if (!t) return null;
  for (const rule of RULES) {
    if (rule.re.test(t)) return { field: rule.field, subField: rule.subField };
  }
  return null;
}

module.exports = { classifyRoleField };

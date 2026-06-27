// ─────────────────────────────────────────────────────────────────────────
// Live source registry for the openings aggregator.
//
// Every source points at an employer's OWN applicant-tracking system (ATS)
// feed — Greenhouse or Workday — so each posting we surface is a real, live
// job req straight from the company, not a hand-typed entry. Adding coverage
// = adding one line here. No scraping of third-party sites, no fake data.
//
// To add a Greenhouse employer: find their board token (the slug in
//   boards.greenhouse.io/<token>) and add { ats: "greenhouse", board: "<token>" }.
// To add a Workday employer: from a posting URL
//   https://<tenant>.<dc>.myworkdayjobs.com/en-US/<site>/job/...
//   add { ats: "workday", tenant, dc, site }.
// ─────────────────────────────────────────────────────────────────────────

const SOURCES = [
  // ── Greenhouse boards (verified responding) ──────────────────────────────
  { company: "Point72", short: "P72", logoClass: "p72", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "point72" },
  { company: "General Atlantic", short: "GA", logoClass: "ga", field: "Finance", subField: "Private Equity", ats: "greenhouse", board: "generalatlantic" },
  { company: "Jane Street", short: "JS", logoClass: "jane", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "janestreet" },
  { company: "DRW", short: "DRW", logoClass: "des", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "drweng" },
  { company: "Jump Trading", short: "JUMP", logoClass: "moe", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "jumptrading" },
  { company: "PDT Partners", short: "PDT", logoClass: "gug", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "pdtpartners" },
  { company: "Squarepoint Capital", short: "SQP", logoClass: "aqr", field: "Finance", subField: "Hedge Fund", ats: "greenhouse", board: "squarepointcapital" },

  // ── Workday tenants (verified responding) ────────────────────────────────
  { company: "Bain Capital", short: "BCap", logoClass: "bcap", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "baincapital", dc: "wd1", site: "External_Public" },
  { company: "Blackstone", short: "BX", logoClass: "bx", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "blackstone", dc: "wd1", site: "Blackstone_Campus_Careers" },
  { company: "Ares Management", short: "ARES", logoClass: "ares", field: "Finance", subField: "Private Equity", ats: "workday", tenant: "aresmgmt", dc: "wd1", site: "external" },
  { company: "Guggenheim Securities", short: "GUG", logoClass: "gug", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "guggenheim", dc: "wd1", site: "Guggenheim_Careers_Campus" },
  { company: "Houlihan Lokey", short: "HL", logoClass: "laz", field: "Finance", subField: "Investment Banking", ats: "workday", tenant: "hl", dc: "wd1", site: "Campus" },
];

module.exports = { SOURCES };

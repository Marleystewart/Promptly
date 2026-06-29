const assert = require("node:assert/strict");
const { openingHtml, safeOfficialUrl } = require("../api/_shared/alerts");

assert.equal(
  safeOfficialUrl("https://jobs.example.com/job/123"),
  "https://jobs.example.com/job/123"
);
assert.equal(safeOfficialUrl("javascript:alert(1)"), "");
assert.equal(safeOfficialUrl("http://jobs.example.com/job/123"), "");

const html = openingHtml({
  company: "Example & Co.",
  role: "Design Intern",
  field: "Design",
  program: "Summer 2027",
  deadline: "Rolling",
  sourceUrl: "https://jobs.example.com/job/123?team=design&year=2027",
}, { name: "Taylor" });

assert.match(html, /Open Official Posting/);
assert.match(html, /https:\/\/jobs\.example\.com\/job\/123\?team=design&amp;year=2027/);
assert.match(html, /Example &amp; Co\./);

const noLinkHtml = openingHtml({ company: "Example", role: "Intern" }, { name: "Taylor" });
assert.doesNotMatch(noLinkHtml, /Open Official Posting/);
assert.match(noLinkHtml, /has not verified a direct posting link/);

console.log("Alert link tests passed.");

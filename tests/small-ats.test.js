// Small public-feed ATS readers (api/_shared/small-ats.js). Payloads are
// trimmed from real tenants on 15 Sep 2026. The thing every reader must get
// right is US-ness, from the feed's own country field — these are mostly
// global consultancies, and a text test on "City, ST" misreads foreign offices.

const assert = require("node:assert/strict");
const { READERS } = require("../api/_shared/small-ats.js");
const { fetchOne } = require("../api/_shared/aggregator.js");

const realFetch = global.fetch;
let respond;
global.fetch = async (url, options = {}) => {
  const body = respond(String(url), options);
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return { ok: true, status: 200, text: async () => text, json: async () => JSON.parse(text) };
};

const titlesWhereUs = (rows) => rows.filter((r) => r.us).map((r) => r.title);

(async () => {
  try {
    // Workable — country is a full name.
    respond = () => ({ name: "Rystad Energy", jobs: [
      { title: "Analyst Intern - Summer 2027", city: "Houston", state: "Texas", country: "United States", url: "https://apply.workable.com/j/A1" },
      { title: "Analyst Intern", city: "Oslo", state: "", country: "Norway", url: "https://apply.workable.com/j/A2" },
    ] });
    const workable = await READERS.workable("rystad-energy");
    assert.deepEqual(titlesWhereUs(workable), ["Analyst Intern - Summer 2027"]);
    assert.equal(workable[0].location, "Houston, Texas, United States");

    // UKG — Country.Code "USA"; a Canadian office with a CA-looking state must not pass.
    respond = (url) => {
      assert.match(url, /^https:\/\/recruiting2\.ultipro\.com\/MIL1017\/JobBoard\/g-1\/JobBoardView\/LoadSearchResults$/);
      return { totalCount: 2, opportunities: [
        { Title: "Actuarial Intern", Id: "u1", PostedDate: "2026-09-01T00:00:00Z", Locations: [{ Address: { City: "Seattle", State: { Code: "WA" }, Country: { Code: "USA" } } }] },
        { Title: "Actuarial Intern", Id: "u2", Locations: [{ Address: { City: "Toronto", State: { Code: "ON" }, Country: { Code: "CAN", Name: "Canada" } } }] },
      ] };
    };
    const ukg = await READERS.ukg("recruiting2.ultipro.com/MIL1017/g-1");
    assert.deepEqual(ukg.map((r) => r.us), [true, false]);
    assert.equal(ukg[0].url, "https://recruiting2.ultipro.com/MIL1017/JobBoard/g-1/OpportunityDetail?opportunityId=u1");
    assert.equal(ukg[0].location, "Seattle, WA, United States");

    // ADP — no country in the address; it rides at the end of shortName.
    respond = () => ({ jobRequisitions: [
      { itemID: "9_1", requisitionTitle: "Data Analyst Intern", postDate: "2026-09-14T13:11:00.000-04:00",
        customFieldGroup: { stringFields: [{ stringValue: "613173", nameCode: { codeValue: "ExternalJobID" } }] },
        requisitionLocations: [{ address: { cityName: "New York", countrySubdivisionLevel1: { codeValue: "NY" } }, nameCode: { shortName: " New York, NY, US" } }] },
      { itemID: "8_1", requisitionTitle: "Field Intern", requisitionLocations: [{ address: { cityName: "Nairobi" }, nameCode: { shortName: " Nairobi, KE" } }] },
    ] });
    const adp = await READERS.adp("cid-1");
    assert.deepEqual(adp.map((r) => r.us), [true, false]);
    assert.match(adp[0].url, /[?&]cid=cid-1&jobId=613173&lang=en_US$/, "the public link uses ExternalJobID");
    assert.equal(adp[0].location, "New York, NY");

    // Paylocity — structured Country "USA" beats the employer's free-text label.
    respond = () => `<script>window.pageData = {"Jobs":[{"JobId":1,"JobTitle":"Economic Consultant","LocationName":"WDC","JobLocation":{"City":"Washington","State":"DC","Country":"USA"}},{"JobId":2,"JobTitle":"Consultant","LocationName":"Teipei, Taiwan","JobLocation":{"Country":"TWN"}}]};</script>`;
    const paylocity = await READERS.paylocity("guid");
    assert.deepEqual(paylocity.map((r) => r.us), [true, false]);
    assert.equal(paylocity[0].location, "Washington, DC");
    assert.equal(paylocity[0].url, "https://recruiting.paylocity.com/Recruiting/Jobs/Details/1");

    // Pinpoint — "Country - City".
    respond = () => ({ data: [
      { title: "Senior Consultant", url: "https://a.pinpointhq.com/en/postings/1", location: { name: "United States - Boulder" } },
      { title: "Pràctiques", url: "https://a.pinpointhq.com/en/postings/2", location: { name: "Spain - Manlleu " } },
    ] });
    const pinpoint = await READERS.pinpoint("a");
    assert.deepEqual(pinpoint.map((r) => r.us), [true, false]);
    assert.equal(pinpoint[0].location, "Boulder, United States");

    // Recruitee — country_code.
    respond = () => ({ offers: [
      { title: "Consultant - United States", city: "Chicago", state_code: "IL", country_code: "US", careers_url: "https://x.recruitee.com/o/1" },
      { title: "Senior Manager", city: "Belo Horizonte", state_code: "MG", country_code: "BR", country: "Brazil", careers_url: "https://x.recruitee.com/o/2" },
    ] });
    assert.deepEqual((await READERS.recruitee("x")).map((r) => r.us), [true, false]);

    // Jobvite — text only, so the positive test decides.
    respond = () => `<td class="jv-job-list-name"> <a href="/camsyscareers/job/o1">Transportation Analyst</a></td><td class="jv-job-list-location"> Medford, MA </td>
      <td class="jv-job-list-name"> <a href="/camsyscareers/job/o2">Planner</a></td><td class="jv-job-list-location"> London, United Kingdom </td>`;
    const jobvite = await READERS.jobvite("camsyscareers");
    assert.deepEqual(jobvite.map((r) => r.us), [true, false]);
    assert.equal(jobvite[0].url, "https://jobs.jobvite.com/camsyscareers/job/o1");

    // Teamtailor — RSS with tt:location nodes.
    respond = () => `<rss><channel><item><title>Junior Delay Analyst</title><link>https://careers.hka.com/jobs/1</link><pubDate>Mon, 14 Sep 2026 09:53:14 +0100</pubDate>
      <tt:locations><tt:location><tt:city>Phoenix</tt:city><tt:country>United States</tt:country></tt:location></tt:locations></item>
      <item><title>Marketing Manager</title><link>https://careers.hka.com/jobs/2</link><tt:locations><tt:location><tt:city>London</tt:city><tt:country>United Kingdom</tt:country></tt:location></tt:locations></item></channel></rss>`;
    const tt = await READERS.teamtailor("hka.teamtailor.com");
    assert.deepEqual(tt.map((r) => r.us), [true, false]);
    assert.equal(tt[0].location, "Phoenix, United States");
    assert.equal(tt[0].postedAt.slice(0, 10), "2026-09-14");

    // Rippling, Breezy, BambooHR.
    respond = () => ({ items: [{ name: "Associate", url: "https://ats.rippling.com/z/jobs/1", locations: [{ name: "Remote (United States)", country: "United States" }] }] });
    assert.deepEqual((await READERS.rippling("z")).map((r) => r.us), [true]);
    respond = () => [{ name: "Associate", url: "https://p.breezy.hr/p/1", location: { city: "New York", state: { id: "NY" }, country: { id: "US" } } }, { name: "Intern", url: "https://p.breezy.hr/p/2", location: { city: "London", country: { id: "GB", name: "United Kingdom" } } }];
    assert.deepEqual((await READERS.breezy("p")).map((r) => r.us), [true, false]);
    respond = () => ({ result: [{ id: 5, jobOpeningName: "Analyst", atsLocation: { city: "Atlanta", state: "Georgia", country: "United States" } }] });
    const bamboo = await READERS.bamboohr("proudfoot");
    assert.deepEqual(bamboo.map((r) => r.us), [true]);
    assert.equal(bamboo[0].url, "https://proudfoot.bamboohr.com/careers/5");

    // JazzHR — text location only.
    respond = () => `<ul class='list-group'> <li class="list-group-item"> <h3 class='list-group-item-heading'> <a href="https://bluematterconsulting.applytojob.com/apply/RaM60FxFiB/Consultant"> Consultant </a> </h3> <ul class='list-inline list-group-item-text'> <li><i class='fa fa-map-marker'></i>New York, NY</li> </ul> </li>
      <li class="list-group-item"> <h3 class='list-group-item-heading'> <a href="https://bluematterconsulting.applytojob.com/apply/Zz/Analyst"> Analyst </a> </h3> <ul class='list-inline list-group-item-text'> <li><i class='fa fa-map-marker'></i>London, United Kingdom</li> </ul> </li></ul>`;
    const jazz = await READERS.jazzhr("bluematterconsulting");
    assert.deepEqual(jazz.map((r) => [r.title, r.us]), [["Consultant", true], ["Analyst", false]]);
    assert.equal(jazz[0].url, "https://bluematterconsulting.applytojob.com/apply/RaM60FxFiB/Consultant");

    // ClearCompany public board — columns vary by employer.
    respond = () => `<table><tr class="reqitem ReqRowClick" data-req-id="1"><td class="leftBorder">&nbsp;</td><td id='posTitle0' class="posTitle reqitem ReqRowClick"><a href="job-opening.php?req=1&req_loc=9&&amp;#job">Transportation Analyst</td> <td id='cities0' class="cities reqitem">Burlington</td> <td id='state0' class="state reqitem">VT</td> <td class="offices reqitem">HQ</td></tr>
      <tr class="reqitem1 ReqRowClick" data-req-id="2"><td id='custSort11' class="custSort1 reqitem1">Assessment&nbsp;</td> <td id='custSort21' class="custSort2 reqitem1">Madrid, Spain&nbsp;</td> <td id='posTitle1' class="posTitle reqitem1"><a href="job-opening.php?req=2&req_loc=8&&amp;#job">Senior Consultant</td></tr></table>`;
    const hrm = await READERS.hrmdirect("rsg");
    assert.deepEqual(hrm.map((r) => [r.location, r.us]), [["Burlington, VT", true], ["Madrid, Spain", false]]);
    assert.equal(hrm[0].url, "https://rsg.hrmdirect.com/employment/job-opening.php?req=1&req_loc=9&");

    // HiBob — tenant named in a header, country structured.
    const hibobHeaders = [];
    respond = (url, options) => { hibobHeaders.push((options.headers || {}).companyidentifier); return { jobAdDetails: [
      { id: "a1", title: "Senior Data Analyst", site: "Remote - US", country: "United States", publishedAt: "2026-07-22T20:40:04Z" },
      { id: "a2", title: "Analyst", site: "Zurich", country: "Switzerland" },
    ] }; };
    const hb = await READERS.hibob("k2integrity");
    assert.deepEqual(hb.map((r) => r.us), [true, false]);
    assert.equal(hb[0].url, "https://k2integrity.careers.hibob.com/jobs/a1");
    assert.deepEqual(hibobHeaders, ["k2integrity"], "the tenant must be named in the companyidentifier header");

    // Paycom — two steps. The career page must be asked for JSON (it serves the
    // HTML shell to anything that accepts text/html), and the search must carry
    // the session token it hands back. Locations are free text carrying street
    // addresses and hiring legal entities, so US-ness must be read from the
    // cleaned "City, ST" part: "Acme Virginia Holdings - Mumbai, India" is not
    // a Virginia job.
    const paycomCalls = [];
    respond = (url, options) => {
      paycomCalls.push([url, (options.headers || {}).Accept, (options.headers || {}).Authorization]);
      if (url.endsWith("/career-page")) return { clientKey: "KEY1", sessionJWT: "jwt-abc" };
      return { jobPostingPreviewsCount: 3, jobPostingPreviews: [
        { jobId: 166267, jobTitle: "2027 Consultant Intern  (19514)", locations: "7272 E INDIAN SCHOOL RD STE 400 - SCOTTSDALE, AZ 85251" },
        { jobId: 141069, jobTitle: "Consultant | Contracts ", locations: "Cornerstone Advisors of Arizona LLC  AZ - Scottsdale, AZ 85251; Cornerstone Advisors of Arizona LLC  FL - Longwood, FL 32779" },
        { jobId: 9, jobTitle: "Consultant", locations: "Acme Virginia Holdings ON - Toronto, ON" },
      ] };
    };
    const paycom = await READERS.paycom("KEY1");
    assert.deepEqual(paycom.map((r) => r.location), ["Scottsdale, AZ", "Scottsdale, AZ; Longwood, FL", "Toronto, ON"]);
    assert.deepEqual(paycom.map((r) => r.us), [true, true, false]);
    assert.equal(paycom[0].url, "https://www.paycomonline.net/v4/ats/web.php/portal/KEY1/jobs/166267");
    assert.equal(paycomCalls[0][1], "application/json", "the career page only returns JSON when asked for JSON");
    assert.equal(paycomCalls[1][2], "Bearer jwt-abc", "the search must carry the session token the career page issued");

    // Through the production fetcher: only US reqs survive, and detectCycle still gates.
    respond = () => ({ name: "Rystad Energy", jobs: [
      { title: "Analyst Intern - Summer 2027", city: "Houston", state: "Texas", country: "United States", url: "https://apply.workable.com/j/A1" },
      { title: "Analyst Intern - Summer 2027", city: "Oslo", country: "Norway", url: "https://apply.workable.com/j/A2" },
      { title: "Senior Analyst", city: "Houston", state: "Texas", country: "United States", url: "https://apply.workable.com/j/A3" },
    ] });
    const rows = await fetchOne({ company: "Rystad Energy", short: "RYS", field: "Consulting", ats: "workable", board: "rystad-energy" });
    assert.deepEqual(rows.map((r) => r.sourceUrl), ["https://apply.workable.com/j/A1"]);
    assert.equal(rows[0].cycle, "Summer 2027");

    console.log("Small-ATS tests passed. Fifteen feeds, US decided by each feed's own country field.");
  } finally {
    global.fetch = realFetch;
  }
})().catch((error) => { console.error(error); process.exit(1); });

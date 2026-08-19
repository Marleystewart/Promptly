// Balyasny's public careers site is a Salesforce Experience Cloud site. This
// invokes the same anonymous Apex action used by its live search component.

const ORIGIN = "https://bambusdev.my.site.com";
const PAGE_PATH = "/s/";
const USER_AGENT = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";

function getCookies(headers) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : String(headers.get("set-cookie") || "").split(/,(?=\s*[^;,=]+\s*=)/);
  return values.filter(Boolean).map((value) => value.split(";", 1)[0]).join("; ");
}

function locationsFor(job) {
  const names = [];
  for (const position of job.Job_Requisition_Positions__r || []) {
    if (position.Location__r?.External_Name__c) names.push(position.Location__r.External_Name__c);
    for (const extra of position.Job_Requisition_Position_Locations__r || []) {
      if (extra.Location__r?.External_Name__c) names.push(extra.Location__r.External_Name__c);
    }
  }
  return [...new Set(names)].join("; ");
}

async function fetchListings() {
  const pageUrl = `${ORIGIN}${PAGE_PATH}`;
  const page = await fetch(pageUrl, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(12000),
  });
  if (!page.ok) throw new Error(`${page.status} balyasny page`);
  const html = await page.text();
  const match = html.match(/\/s\/sfsites\/l\/(%7B.*?%7D)\/inline\.js/);
  if (!match) throw new Error("balyasny Salesforce context missing");

  const context = JSON.parse(decodeURIComponent(match[1]));
  Object.assign(context, { globals: {}, uad: true, dn: [] });
  const message = {
    actions: [{
      id: "1;a",
      descriptor: "aura://ApexActionController/ACTION$execute",
      callingDescriptor: "UNKNOWN",
      params: {
        namespace: "",
        classname: "BamJobRequisitionInfoDataService",
        method: "searchJobRequisitions",
        params: {
          isVendorPortal: false,
          site: "BAM Website",
          searchKey: "",
          locationFilters: [],
          departmentFilter: [],
          availableLocations: [],
          experienceLevelFilter: [],
        },
        cacheable: true,
        isContinuation: false,
      },
    }],
  };
  const body = new URLSearchParams({
    message: JSON.stringify(message),
    "aura.context": JSON.stringify(context),
    "aura.pageURI": PAGE_PATH,
    "aura.token": "null",
  });

  const response = await fetch(`${ORIGIN}/s/sfsites/aura`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      "user-agent": USER_AGENT,
      cookie: getCookies(page.headers),
      origin: ORIGIN,
      referer: pageUrl,
    },
    body,
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`${response.status} balyasny search`);
  const payload = await response.json();
  const action = payload.actions?.[0];
  if (action?.state !== "SUCCESS") throw new Error("balyasny search action failed");
  const jobs = action.returnValue?.returnValue || [];

  return jobs.map((job) => {
    const key = `${job.Job_Req_Title_in_URL__c}_${job.Requisition_Number__c}`;
    return {
      title: job.Publish_Title__c || job.Name,
      url: `${ORIGIN}/s/details?jobReq=${encodeURIComponent(key)}`,
      location: locationsFor(job),
    };
  }).filter((job) => job.title && job.url);
}

module.exports = fetchListings;

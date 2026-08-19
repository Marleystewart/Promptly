// Interactive Brokers uses a public Dayforce candidate portal. Dayforce's
// search API requires the anonymous CSRF token issued by that same portal.

const ORIGIN = "https://jobs.dayforcehcm.com";
const BOARD_PATH = "/en-US/ibgllc/CANDIDATEPORTAL";
const SEARCH_PATH = "/api/geo/ibgllc/jobposting/search";
const PAGE_SIZE = 25;
const USER_AGENT = "Mozilla/5.0 (compatible; PromptlyJobs/1.0)";

function setCookies(headers, jar) {
  const values = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : String(headers.get("set-cookie") || "").split(/,(?=\s*[^;,=]+\s*=)/);
  for (const value of values) {
    const pair = value.split(";", 1)[0];
    const name = pair.slice(0, pair.indexOf("="));
    if (name) jar.set(name, pair);
  }
}

function cookieHeader(jar) {
  return [...jar.values()].join("; ");
}

async function fetchListings() {
  const boardUrl = `${ORIGIN}${BOARD_PATH}`;
  const jar = new Map();
  const board = await fetch(boardUrl, {
    headers: { "user-agent": USER_AGENT },
    signal: AbortSignal.timeout(12000),
  });
  if (!board.ok) throw new Error(`${board.status} interactivebrokers board`);
  setCookies(board.headers, jar);

  const csrfResponse = await fetch(`${ORIGIN}/api/auth/csrf`, {
    headers: { "user-agent": USER_AGENT, cookie: cookieHeader(jar), referer: boardUrl },
    signal: AbortSignal.timeout(12000),
  });
  if (!csrfResponse.ok) throw new Error(`${csrfResponse.status} interactivebrokers csrf`);
  setCookies(csrfResponse.headers, jar);
  const { csrfToken } = await csrfResponse.json();
  if (!csrfToken) throw new Error("interactivebrokers csrf token missing");

  const jobs = [];
  for (let start = 0; start < 500; start += PAGE_SIZE) {
    const response = await fetch(`${ORIGIN}${SEARCH_PATH}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": USER_AGENT,
        cookie: cookieHeader(jar),
        origin: ORIGIN,
        referer: boardUrl,
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({
        clientNamespace: "ibgllc",
        jobBoardCode: "CANDIDATEPORTAL",
        cultureCode: "en-US",
        paginationStart: start,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error(`${response.status} interactivebrokers search`);
    const data = await response.json();
    const postings = Array.isArray(data.jobPostings) ? data.jobPostings : [];

    for (const job of postings) {
      const locations = (job.postingLocations || [])
        .map((location) => location.formattedAddress)
        .filter(Boolean);
      jobs.push({
        title: job.jobTitle,
        url: `${ORIGIN}${BOARD_PATH}/jobs/${job.jobPostingId}`,
        location: [...new Set(locations)].join("; ") || (job.hasVirtualLocation ? "Remote" : ""),
      });
    }

    if (!postings.length || start + postings.length >= Number(data.maxCount || 0)) break;
  }

  return jobs.filter((job) => job.title && job.url);
}

module.exports = fetchListings;

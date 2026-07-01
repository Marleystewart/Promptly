const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const statsHandler = require("../api/stats");

const apiDir = path.join(__dirname, "..", "api");
const topLevelFunctions = fs.readdirSync(apiDir).filter((name) => name.endsWith(".js"));
assert.equal(topLevelFunctions.length, 12, "Vercel Hobby supports at most 12 top-level API functions");
assert.equal(topLevelFunctions.includes("status.js"), false);

function response() {
  return {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(name, value) { this.headers[name] = value; },
  };
}

(async () => {
  const getResponse = response();
  await statsHandler({ method: "GET" }, getResponse);
  assert.equal(getResponse.statusCode, 200);
  assert.deepEqual(getResponse.body, {
    activeToday: 0,
    applicationsToday: 0,
    signupsToday: 0,
    newListingsThisWeek: 0,
  });
  assert.match(getResponse.headers["Cache-Control"], /s-maxage=60/);

  const postResponse = response();
  await statsHandler({
    method: "POST",
    body: { school: "Example U", stage: "Applied", company: "Acme", field: "Technology" },
  }, postResponse);
  assert.equal(postResponse.statusCode, 200);
  assert.deepEqual(postResponse.body, { ok: true, stored: false });

  const rejectedResponse = response();
  await statsHandler({ method: "DELETE" }, rejectedResponse);
  assert.equal(rejectedResponse.statusCode, 405);

  console.log("API function consolidation tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

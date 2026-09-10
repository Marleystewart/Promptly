const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const statsHandler = require("../api/stats");

const apiDir = path.join(__dirname, "..", "api");
const topLevelFunctions = fs.readdirSync(apiDir).filter((name) => name.endsWith(".js"));
assert.equal(topLevelFunctions.length, 12, "Vercel Hobby supports at most 12 top-level API functions");
assert.equal(topLevelFunctions.includes("status.js"), false);

// Every endpoint must actually export a request handler.
//
// This exists because of a real outage. An edit inserted a helper function
// immediately before `async function handler`, which happened to be the tail of
// the line `module.exports = async function handler(req, res) {`. The file still
// parsed, `node --check` was happy, and every other test passed — they read the
// source as text or called one specific endpoint. But admin-stats.js was now
// exporting the helper instead of the handler, so the live endpoint took
// (subscriber) instead of (req, res), never wrote a response, and the admin page
// simply would not open.
//
// Requiring the module is what catches it: a handler is a function of arity 2.
for (const file of topLevelFunctions) {
  const mod = require(path.join(apiDir, file));
  assert.equal(typeof mod, "function", `${file} must export a request handler`);
  assert.equal(
    mod.length,
    2,
    `${file} exports a function taking ${mod.length} argument(s); a Vercel handler takes (req, res)`
  );
}

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
    appOpensToday: 0,
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
  assert.deepEqual(postResponse.body, { ok: false, stored: false, error: "outcome tracking disabled" });

  const rejectedResponse = response();
  await statsHandler({ method: "DELETE" }, rejectedResponse);
  assert.equal(rejectedResponse.statusCode, 405);

  console.log("API function consolidation tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

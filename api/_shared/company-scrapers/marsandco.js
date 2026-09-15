// Mars & Co splits its hiring across two Greenhouse boards, one per US office.
// Both are linked from marsandco.com/careers and both state the employer:
//   marscousg  -> "Mars & Co - New York City Area"
//   marscosfo  -> "Mars & Co - San Francisco"
// One registry row can only name one board, so this reads both.
const BOARDS = ["marscousg", "marscosfo"];

async function readBoard(board) {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`${res.status} greenhouse ${board}`);
  const data = await res.json();
  return (Array.isArray(data.jobs) ? data.jobs : []).map((job) => ({
    title: job.title,
    url: job.absolute_url,
    location: (job.location || {}).name || "",
    postedAt: job.first_published || job.updated_at || null,
  }));
}

module.exports = async function fetchListings() {
  const results = await Promise.allSettled(BOARDS.map(readBoard));
  // One office's board failing must not blank the other's roles — but if both
  // fail, surface it so source health reports the employer as down.
  if (results.every((r) => r.status === "rejected")) throw results[0].reason;
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
};

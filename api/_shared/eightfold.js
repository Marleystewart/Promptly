// Eightfold-hosted career sites.
//
// Eightfold serves two different APIs and only one of them is usable here:
//
//   /api/apply/v2/jobs  — what Millennium's custom microsite exposes. On a
//                         branded tenant (careers.qualcomm.com) it answers 403.
//   /api/pcsx/search    — what the branded careers page itself calls. Open, no
//                         token, and works from a plain Node fetch.
//
// That distinction cost an hour: the 403 looks like bot protection and reads as
// "this employer cannot be scraped", when in fact the wrong endpoint was being
// asked. Millennium keeps its own scraper because its microsite genuinely uses
// the other API.
//
// Results are NOT US-filtered here — callers pipe through usOnly(). Eightfold
// tenants are typically global (Qualcomm's first page is Colombia, Ireland and
// Brazil), so that filtering is the caller's decision, not a hidden default.

const PAGE = 10; // the API ignores `num` and returns 10 regardless
const MAX = 100; // 10 pages per term is plenty for student roles

// Epoch seconds or milliseconds → ISO, without guessing wrong in either
// direction. Anything below this threshold cannot be a plausible millisecond
// timestamp (it would be 1970), so it is seconds.
const MS_THRESHOLD = 1e11; // ~1973 in ms, ~5138 in seconds

function epochToIso(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  const ms = n < MS_THRESHOLD ? n * 1000 : n;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Resolve whatever Eightfold gives us against the tenant's own origin.
// Already-absolute values are returned untouched, so a tenant that starts
// returning full URLs keeps working.
function absoluteJobUrl(job, origin) {
  const raw = job && job.positionUrl ? String(job.positionUrl).trim() : "";
  if (raw) {
    try {
      return new URL(raw, origin).toString();
    } catch {
      // Unparseable — fall through to the id-based form rather than emitting
      // something a student cannot click.
    }
  }
  if (job && job.id) return `${String(origin).replace(/\/+$/, "")}/careers/job/${job.id}`;
  return null;
}

async function fetchEightfoldListings(origin, domain, terms) {
  const seen = new Map();

  for (const term of terms) {
    for (let start = 0; start < MAX; start += PAGE) {
      let data;
      try {
        const url = new URL("/api/pcsx/search", origin);
        url.searchParams.set("domain", domain);
        url.searchParams.set("query", term);
        url.searchParams.set("location", "");
        url.searchParams.set("start", String(start));
        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; PromptlyJobs/1.0)",
          },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) throw new Error(`${res.status} eightfold ${domain}`);
        data = await res.json();
      } catch (error) {
        // First page failing is a real fault worth surfacing to source-health.
        // A later page failing mid-walk should not discard what we already have.
        if (start === 0) throw error;
        break;
      }

      const positions = (data && data.data && data.data.positions) || [];
      for (const job of positions) {
        if (!job || !job.name) continue;
        const id = String(job.id || job.displayJobId || job.name);
        if (seen.has(id)) continue;
        seen.set(id, {
          title: job.name,
          // positionUrl is ALWAYS a relative path ("/careers/job/549798287199"),
          // so the fallback beside it never ran and every Eightfold listing
          // shipped a link that resolves against Promptly's own origin instead
          // of the employer's. On 10 Sep 2026 that was 13 live listings across
          // Qualcomm, Mayo Clinic and Morgan Stanley: a student tapping Apply
          // landed on an app.joinpromptly.co URL that does not exist.
          //
          // For a product whose whole claim is a live link to the employer's
          // own posting, this is the worst thing that can be wrong, and it is
          // invisible from our side — the listing looks perfect until someone
          // clicks it.
          url: absoluteJobUrl(job, origin),
          // Eightfold returns an array; the first entry is the primary office.
          location: Array.isArray(job.locations) ? job.locations.join("; ") : (job.locations || ""),
          // postedTs is epoch SECONDS, not milliseconds — the comment here used
          // to say milliseconds and the conversion trusted it, so every
          // Eightfold posting carried a postedAt in January 1970. Verified
          // against live Qualcomm data on 9 Sep 2026: postedTs 1788912000 is
          // 2026-09-09, and reading it as milliseconds gives 1970-01-21.
          //
          // This is not cosmetic. postedAt drives the recruiting-cycle
          // calendar and the "posted" line on a card, so every Eightfold role
          // sorted as 56 years old.
          //
          // Guarded rather than blindly multiplied: if Eightfold ever switches
          // to milliseconds, a value already past ~2001 in seconds would be
          // pushed to the year 58000 instead of being read correctly.
          postedAt: epochToIso(job.postedTs),
        });
      }

      const total = Number((data && data.data && data.data.count) || 0);
      if (!positions.length || start + positions.length >= total) break;
    }
  }

  return [...seen.values()];
}

module.exports = { fetchEightfoldListings };

# Ground rules

For Trey and Cam. Every one of these exists because breaking it has already
broken something in production — none are style preferences.

## Branching

**Branch, then open a PR. Never push to `main`.** `main` auto-deploys to
app.joinpromptly.co, so a push there is a deploy to real students with nobody
in between. Marley merges.

Name branches `trey/<thing>` or `cam/<thing>` so ownership is obvious.

**Branch from `main`, not from another branch.** A branch cut from a branch
silently carries the other one's commits, and merging the second PR then leaves
the first with nothing to compare — GitHub simply refuses it with no useful
message.

**A branch's raw diff lies if it was cut before someone else's merge.** Check
`git merge-base` and verify with a real 3-way merge (`git merge --no-commit`).
Reading the diff alone is how you silently revert someone's work.

## Cache-busting: bump on `main`, after merging

Promptly is a static site with no bundler, so browsers only know a file changed
because of the `?v=` string on its tag. Skip it and your fix never reaches
anyone who already has the app open — it looks like your change did nothing,
which is miserable to debug.

**Do not run `npm run bump` on your branch.** All assets share one version, so
the bump rewrites the same six files every time and any two branches that both
bump conflict by construction — on a version number, not on real work. The
script now refuses to run off `main` and tells you this.

**The bump itself also has to go through a PR.** A repository ruleset now
blocks every direct push to `main` — "Changes must be made through a pull
request" — and that applies to Marley too, so there is no version of this where
you push the bump straight to `main`. It still has to be RUN on `main`, because
that is the only place with every merged change in it; it just cannot be pushed
from there.

The order that works:

1. Do the work on your branch. **Leave the version alone.**
2. Open the PR, get it merged.
3. On `main`: `git pull && npm run bump && npm test`
4. Commit that bump onto its own branch (`chore/bump-<version>`), open a PR,
   merge it. That second merge is what actually reaches students.

Step 3 without step 4 is the easy mistake: the bump exists only on your machine,
`main` still carries the old `?v=`, and the fix you already merged never reaches
anyone with the app open.

`npm test` fails on a version mismatch, so it cannot be forgotten. If you hit
the conflict anyway, don't hand-pick a version out of the diff — keep either
side's content and re-run `npm run bump`, so the result is newer than both.

## Testing

**`npm test` before every push. No exceptions.** The suites encode bugs already
paid for once.

**Verify UI at 375px in a real browser** — not by reading CSS. Reading a
stylesheet tells you what you wrote, not what renders.

**A test that cannot fail is worthless.** After writing one, break the code
deliberately and confirm it goes red. Several tests written here passed happily
against the exact bug they were meant to catch.

## Structure

**New server code goes in `api/_shared/`, never a new top-level file in
`api/`.** We are at Vercel's 12-function ceiling and a test asserts it.

**`monitored.js` is generated.** Run `node scripts/generate-monitored.js` after
any `sources.js` change — it also rewrites the public "N employers monitored"
number, so a stale run publishes a false claim.

**Any new root-level JS must be added to `scripts/build-web.js`** or it 404s
inside the native app.

## Adding a source

Read [`SOURCE-HUNTING-FINDINGS.md`](SOURCE-HUNTING-FINDINGS.md) first — it
records every platform already tried, which ones are impossible, and the exact
traps. Start with `node scripts/discover-ats.js "Company Name"`.

**Never trust a "0 results" from a new source** without checking the raw feed by
hand.

**A resolving board is not proof of ownership.** `ashby:silver` is Silver.dev,
not Silver Lake. Verify against the board's own stated name.

**SmartRecruiters returns HTTP 200 with `totalFound: 0` for any string.** A zero
there is no evidence at all.

**Run every new source through `aggregateOpenings()` and check for leakage**
before merging — foreign locations and senior titles. This is not a formality:
it caught `usOnly()` admitting "Tijuana, Baja California, **Mexico**" (the state
name sits inside the Mexican region), and EY reporting 286 "US" roles that were
overwhelmingly Indian because `", IN,"` reads as Indiana. Either would have put
unreachable jobs in front of students.

**A source we cannot read is worse than a placeholder.** It promises an alert
that will never arrive. If a company has no readable feed, write that down in
the findings doc instead of forcing something in.

## Monitoring

**Probe the integration; don't check that it's configured.** USAJOBS returned
zero for hours while its health check stayed green, because the check only
tested that the env vars existed — someone had pasted the variable *name* into
the value field.

**Be suspicious of your own alarms.** Three monitoring bugs shipped here in two
days, all the same shape: claiming something was wrong when it wasn't. A
dashboard that reports a false problem is worse than one that reports nothing,
because it sends you to fix something that isn't broken. Before shipping an
alert, ask what it does on a normal day.

# Promptly production setup

## Accounts

Promptly uses Supabase Auth for email/password and Google sign-in. Profiles and saved alerts are stored in each user's secure account metadata and remain available across devices.

1. Create or select a Supabase project.
2. In Supabase Project Settings > API, copy the Project URL, publishable key, and service-role secret.
3. Add these Vercel environment variables for Production and Preview:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for Delete Account, and never safe to expose in browser code)
4. In Supabase Authentication > URL Configuration, set the Site URL to `https://promptly-ctm.vercel.app` and add that same URL to Redirect URLs.
5. Keep the Email provider enabled. Enable Google only after adding Google OAuth credentials in Supabase.
6. Redeploy Promptly in Vercel.

Without these values, Promptly intentionally falls back to a profile stored only on the current device.

For launch, configure custom SMTP in Supabase so confirmation and password-reset emails are not limited by the default sender.

## Alert delivery

Email alerts use Resend. Phone notifications use Web Push and the VAPID variables documented in `.env.example`. New openings are collected from employer ATS feeds, and each delivered alert links to the exact HTTPS posting returned by that feed.

## Shipping a change to CSS or JS

Promptly is a static site with no bundler, so browsers are told a file changed
by the `?v=` query string on its `<script>`/`<link>` tag. Skip that and your fix
never reaches anyone who already has the app open — it will look as though the
change did nothing, which is a miserable thing to debug.

Every asset shares one version. Bump it with:

```bash
npm run bump
```

That rewrites every `?v=` across all pages and sets the service-worker cache
name to match, so the two can never drift apart. Pass an explicit version if you
need one (`node scripts/bump-version.js 20260903h`).

`npm test` fails if the versions disagree, so a forgotten bump is caught before
it ships rather than by a returning user.

### Bump on `main`, not on your branch

**Do not run `npm run bump` in a feature branch.** One shared version means the
bump rewrites the same six files every time — `index.html`, `privacy.html`,
`terms.html`, `how-it-works.html`, `service-worker.js` and the generated
`monitored.js` meta. Two branches that both bump therefore conflict by
construction, on a version number rather than on any real disagreement. That
happened immediately once two PRs were open at once.

The order that avoids it:

1. Do the work on your branch. **Leave the version alone.**
2. Open the PR and get it merged.
3. On `main`: `git pull && npm run bump && npm test && git push`

`npm test` still fails on a mismatch, so the bump cannot be forgotten — it just
happens once, in one place, instead of racing between branches.

If you hit the conflict anyway, do not hand-pick a version out of the diff.
Resolve by keeping either side's content and re-running `npm run bump`, so the
result is newer than both rather than whichever number won a textual merge.

## Daily health email

The daily cron sends a short status email so a broken pipeline reaches a person
without anyone remembering to open `/admin.html`. It goes to
`help.promptly@gmail.com` unless `ADMIN_ALERT_EMAIL` is set in Vercel.

It sends **every day**, healthy or not, and the subject carries the state:

```
Promptly OK — 872 listings live
Promptly NEEDS ATTENTION — 2 problems
```

That is deliberate. An alerts-only design cannot tell "everything is fine" apart
from "the thing that sends the alerts is dead" — silence looks the same in both
cases. **If the email stops arriving, treat that as the alert.**

It reports zero-listing feeds, email that cannot reach students, a cron that has
failed or stopped firing, and how many digests actually went out.

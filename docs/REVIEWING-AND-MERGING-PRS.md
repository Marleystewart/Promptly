# Reviewing and merging pull requests — for Cam

Written 18 Sep 2026. The point of this doc is that you can merge your own work
and review Marley's without waiting on him. Nothing here needs his account.

Promptly ships from `main`. Every change reaches `main` through a pull request,
because the PR is where the tests run and where the diff is readable. Pushing
straight to `main` skips both.

---

## 0. One-time setup

Install the GitHub CLI and sign in:

```bash
brew install gh
```

```bash
gh auth login
```

Choose **GitHub.com**, **HTTPS**, and authenticate in the browser. You only do
this once. Check it worked:

```bash
gh auth status
```

You need write access on `Marleystewart/Promptly`. If `gh` says you do not have
permission, ask Marley to add you as a collaborator — that is the one step only
he can do.

---

## 1. Look at what is waiting

```bash
gh pr list
```

Each line is a PR number, title, and branch. To read one:

```bash
gh pr view 160
```

Add `--web` to open it in the browser, which is easier for a long diff:

```bash
gh pr view 160 --web
```

To read the actual code changes in the terminal:

```bash
gh pr diff 160
```

---

## 2. Check the tests passed

This is the part that matters most. Promptly has 48 test suites and a Vercel
preview deploy, and they all report onto the PR.

```bash
gh pr checks 160
```

Every line should say `pass`. If anything says `fail`, **do not merge** — open
the link in that row to see what broke. A failing check is the suite telling you
the change is wrong; it is not a formality.

`pending` means it is still running. Wait and run the command again.

---

## 3. Try it yourself before merging

For anything that changes what a student sees, pull the branch down and run it:

```bash
gh pr checkout 160
```

```bash
npm test
```

```bash
npm start
```

That serves the site at http://localhost:4173. Click through the actual change.
When you are done:

```bash
git checkout main
```

The Vercel preview link on the PR does the same thing without checking out —
it is a real deployment of that branch, safe to click around in.

---

## 4. Leave a review

If it looks right:

```bash
gh pr review 160 --approve --body "Tested the Google flow on my phone, works."
```

If something is off, request changes instead — this is normal and useful:

```bash
gh pr review 160 --request-changes --body "The error message still says 'Safari' on the signup tab."
```

Just a question, no verdict:

```bash
gh pr comment 160 --body "Does this change anything for people already signed in?"
```

---

## 5. Merge it

```bash
gh pr merge 160 --merge
```

Then delete the branch, which `gh` will offer to do — say yes. A merged branch
left behind clutters the list and someone eventually commits to it by mistake.

Use `--merge` (a merge commit), not `--squash` or `--rebase`. It is what this
repo has always used, and a consistent history is easier to read backwards when
something breaks.

After merging, update your local copy:

```bash
git checkout main
```

```bash
git pull
```

---

## 6. Opening your own PR

Never start work on `main`. Branch first:

```bash
git checkout main && git pull && git checkout -b fix/short-description
```

Make your changes, then:

```bash
npm test
```

All 48 suites must pass locally before you push. If one fails, the failure
message names the file and what it expected — fix it, do not skip it.

```bash
git add -A && git commit -m "fix: what this changes and why"
```

```bash
git push -u origin fix/short-description
```

```bash
gh pr create
```

It will prompt for a title and body. In the body, say what was broken, what you
changed, and how you tested it. Future-you reads this more often than you think.

---

## Rules worth not breaking

- **Never push to `main` directly.** Always a branch, always a PR.
- **Never merge with a failing check.** The suite is right more often than the
  hunch that it is a fluke.
- **Never run `npm run bump` on a branch.** The version bump rewrites the same
  six files every time, so two branches that both bump always conflict. Bump on
  `main`, after merging, as its own PR.
- **Do not commit secrets.** No API keys, no Supabase service-role key, no
  `.env`. The `no-client-secrets` test catches most of this, but not all of it.
- **If a merge looks scary, it is fine to stop.** Nothing in this repo is urgent
  enough to justify merging something you do not understand.

---

## When something goes wrong

Merged something that broke the site:

```bash
gh pr list --state merged --limit 5
```

Find the PR number, then revert it — this opens a new PR that undoes it:

```bash
gh pr revert 161
```

Merge that revert PR the normal way. Reverting is cheap and not embarrassing;
leaving a broken `main` up while you debug is the actual mistake.

# Promptly production setup

## Accounts

Promptly uses Supabase Auth for email/password and Google sign-in. Profiles and saved alerts are stored in each user's secure account metadata and remain available across devices.

1. Create or select a Supabase project.
2. In Supabase Project Settings > API, copy the Project URL and publishable key.
3. Add these Vercel environment variables for Production and Preview:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
4. In Supabase Authentication > URL Configuration, set the Site URL to `https://promptly-ctm.vercel.app` and add that same URL to Redirect URLs.
5. Keep the Email provider enabled. Enable Google only after adding Google OAuth credentials in Supabase.
6. Redeploy Promptly in Vercel.

Without these values, Promptly intentionally falls back to a profile stored only on the current device.

For launch, configure custom SMTP in Supabase so confirmation and password-reset emails are not limited by the default sender.

## Alert delivery

Email alerts use Resend. Phone notifications use Web Push and the VAPID variables documented in `.env.example`. New openings are collected from employer ATS feeds, and each delivered alert links to the exact HTTPS posting returned by that feed.

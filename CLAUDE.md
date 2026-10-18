@AGENTS.md

## Git commits

- Author every commit as `Ali Kheyirkhabarli <ali.xov08@gmail.com>`. Cloud
  sessions start with git configured as `Claude <noreply@anthropic.com>`, so
  before the first commit of a session run:

  ```
  git config user.name "Ali Kheyirkhabarli"
  git config user.email "ali.xov08@gmail.com"
  ```

- Do not add `Co-Authored-By` or `Claude-Session` trailers to commit messages.

## Branches and environments

- `pre` → https://pre.barakatly.az (Vercel Preview, its own Supabase project,
  `NEXT_PUBLIC_APP_ENV=pre`). `main` → https://barakatly.az (production).
- Push every change to `pre` first. Merge `pre` into `main` only after the
  user has checked it on the test site and says it can go live.
- New migrations run in the PRE Supabase project first, then in production.
  After adding one, run `npm run db:combine` to refresh
  `supabase/pre/all_migrations.sql`.

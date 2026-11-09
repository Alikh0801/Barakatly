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

## Installed app (PWA) and its Figma design

- The site installs as an app (manifest, `public/sw.js`). The Figma design
  "Barakatly — Full E2E Prototype" (file `E1FTYawCiUYFv2aZQD0BLG`) applies
  **only inside the installed app**: style it with the `app:` Tailwind
  variant (display-mode: standalone, or `[data-app-mode]` on `<html>`).
  The website in a browser tab, phone or computer, must not change.
- A page gets its app screen next to the website markup: the website part
  is wrapped in `app:hidden`, the app screen (`src/components/app/`) has
  `hidden app:block` and `data-app-screen`, which hides the site header in
  the app. Tab bar: `src/components/app/AppTabBar.tsx`.
- Take only the layout, spacing, colours, fonts and icons from Figma (the
  icons are Lucide). **Pictures and texts stay as on the site**: use the
  site's logo, product/category images and wording, not the design's
  mascot pictures or sample texts.
- The site's logic stays as it is (farm names removed, its order
  statuses, product sizes, promo codes, 3-step checkout); the design
  adapts to it.
- Do not move the app work to production until the whole design is done
  and the user says so.

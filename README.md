# Barakatly

Farm produce marketplace: farmers list products, customers order and pay by
bank transfer, admins confirm payments and run orders, couriers deliver.
Next.js (App Router) on Vercel, Supabase for the database, auth and storage.

## Run locally

```bash
cp .env.example .env.local   # fill in the Supabase keys
npm install
npm run dev
```

## Branches and database

- `pre` deploys to https://pre.barakatly.az (its own Supabase project),
  `main` to https://barakatly.az. Changes go to `pre` first.
- Migrations live in `supabase/migrations`, numbered. Run a new one in the
  PRE project, then in production. `npm run db:combine` rebuilds
  `supabase/pre/all_migrations.sql`, the whole schema in one file for a
  fresh project.

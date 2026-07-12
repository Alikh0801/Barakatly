# Supabase setup — BARAKATLY

## 1. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Copy these values into `.env.local` (see `.env.example`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 2. Run migrations

In the Supabase dashboard, open **SQL Editor** and run these files **in order**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed.sql`

## 3. Configure Auth providers

In **Authentication → Providers**:

- **Email** — enable (for customers)
- **Google** — enable (optional, for customers)
- **Phone** — enable (for farmers)

## 4. Storage buckets

Buckets are created by `001_initial_schema.sql`:

- `product-images` (public)
- `payment-receipts` (private)
- `farmer-photos` (public)

## 5. Create the first admin user

After your first signup, promote the user in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```

## Schema overview

| Table | Purpose |
|---|---|
| `profiles` | User roles and basic info |
| `farmers` | Farmer registration + approval |
| `couriers` | Courier accounts (admin-created) |
| `categories` | Product categories |
| `products` | Farmer products + admin pricing |
| `product_images` | Product photos |
| `banks` | Manual payment bank list |
| `orders` | Customer orders |
| `order_items` | Per-farmer order split |
| `payments` | Receipt upload + admin confirmation |
| `order_status_events` | Status history |
| `notifications` | In-app notifications |

## Repo integration

```
src/lib/supabase/
├── client.ts   # Browser client
├── server.ts   # Server Components / actions
└── proxy.ts    # Session refresh helper

src/proxy.ts    # Next.js 16 proxy (auth session)
```

## Next step

After migrations are applied, continue with **Auth flows** (customer registration).

## Auth (email)

Customer auth pages:

- `/signup` — email + password registration
- `/signin` — login
- `/account` — basic profile page (protected)
- `/auth/callback` — email confirmation redirect
- `/auth/signout` — logout (POST)

### Supabase Auth settings

In **Authentication → Providers**, enable **Email** only for now.

For local development, you can disable email confirmation in:
**Authentication → Providers → Email → Confirm email** (optional for testing).

Set redirect URL in **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000` (or your Vercel URL)
- Redirect URLs: `http://localhost:3000/auth/callback`

### Promote first admin

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```


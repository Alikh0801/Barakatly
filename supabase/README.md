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
3. `supabase/migrations/003_seed.sql` — kateqoriyalar və banklar
4. `supabase/migrations/004_demo_products.sql` — no-op (köhnə demo seed ləğv olunub)
5. `supabase/migrations/005_remove_demo_catalog.sql` — mövcud demo məhsul/fermerləri silir
6. `supabase/migrations/006_remove_herbs_category.sql` — Göyərti kateqoriyasını və bağlı məhsulları silir

Məhsul və şəkilləri fermerlər özləri əlavə edir; demo kataloq yoxdur.

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

| Field | Value |
|---|---|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` |

Important:
- Add **one URL per line** — do not paste multiple URLs with spaces.
- `.env.local` must have exactly: `NEXT_PUBLIC_APP_URL=http://localhost:3000` (no trailing slash, no extra URLs).
- After email confirmation, users are redirected to `/auth/callback` and logged in on the homepage.

### Login captcha (Cloudflare Turnstile)

Sign-in is protected by Turnstile — but only once it's configured on both sides. Without it, sign-in works exactly as before.

1. Create a Turnstile widget at [dash.cloudflare.com → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) (free). Use widget mode **Managed**. Add your domain(s), e.g. `localhost` and `barakatly.az`.
2. Copy the **Site Key** into `.env.local` (and Vercel env vars):
   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
   ```
3. Copy the **Secret Key** into **Supabase → Authentication → Attack Protection** (or **Settings** on older projects) → **Enable Captcha protection** → provider **Turnstile** → paste the secret key → Save.

If the site key env var is missing, the sign-in form simply renders without the captcha widget — nothing breaks.

## Vercel deploy

In **Vercel → Settings → Environment Variables** (Production):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://barakatly.az
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
```

If `NEXT_PUBLIC_APP_URL` is missing, the app auto-detects the Vercel URL at runtime.

In **Supabase → Authentication → URL Configuration**:

| Field | Value |
|---|---|
| Site URL | `https://barakatly.az` |
| Redirect URLs | `https://barakatly.az/auth/callback` |
| | `http://localhost:3000/auth/callback` |

After changing env vars, **redeploy** on Vercel.

### Promote first admin

```sql
update public.profiles
set role = 'admin'
where email = 'your-email@example.com';
```


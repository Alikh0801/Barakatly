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

In **Authentication → Providers**, enable **Email**. See below to also enable **Google**.

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

### Signup confirmation — 6-digit code, no link

Customer signup no longer relies on a confirmation link. The app calls `verifyOtp` with a 6-digit code the user types in, so the "Confirm signup" email must show the code instead of a link.

In **Supabase → Authentication → Email Templates → Confirm signup**, set:

**Subject:**
```
Barakatly — təsdiq kodunuz: {{ .Token }}
```

**Message body** (replace the whole body with this — all styles are inline since email clients strip `<style>` tags):

```html
<div style="background-color:#f4f6f5;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background-color:#1f5c3d;padding:24px 32px;text-align:center;">
      <span style="color:#ffffff;font-size:20px;font-weight:700;">🌿 Barakatly</span>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 12px;font-size:18px;color:#111827;">Təsdiq kodunuz</h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#4b5563;">
        Barakatly hesabınızı təsdiqləmək üçün aşağıdakı kodu qeydiyyat formasına daxil edin:
      </p>
      <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1f5c3d;">{{ .Token }}</span>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
        Bu kod <strong>1 saat</strong> ərzində keçərlidir.
      </p>
      <p style="margin:0;font-size:13px;color:#6b7280;">
        Bu tələbi siz etməmisinizsə, bu email-i sadəcə nəzərə almayın.
      </p>
    </div>
    <div style="background-color:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <span style="font-size:12px;color:#9ca3af;">© Barakatly — Yerli fermerlərdən birbaşa süfrənizə</span>
    </div>
  </div>
</div>
```

Do **not** include `{{ .ConfirmationURL }}` anywhere — only `{{ .Token }}` is used, so there's no link to click. Save the template. No code/env changes needed — the signup form already shows a code-entry step right after "Qeydiyyatdan keç".

### Google sign-in

No app-side env vars needed — the whole OAuth dance happens between the browser, Supabase, and Google; our app never sees Google's client secret.

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create Credentials → OAuth client ID** → application type **Web application**.
2. **Authorized redirect URIs** — add Supabase's own callback, *not* our app's:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
   (find `<project-ref>` in `NEXT_PUBLIC_SUPABASE_URL`).
3. **Authorized JavaScript origins** — add `https://barakatly.az` and, for local testing, `http://localhost:3000`.
4. Copy the generated **Client ID** and **Client Secret**.
5. In **Supabase → Authentication → Providers → Google** — enable it, paste the Client ID and Client Secret, Save.

That's it — the "Google ilə davam et" button on `/signin` and `/signup` starts working immediately, no redeploy needed. If the provider isn't enabled yet, clicking the button just shows "Google ilə giriş hazırda mövcud deyil." instead of breaking the page.

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


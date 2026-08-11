-- Subcategories + farmer-submitted category/subcategory approval workflow
-- Idempotent: safe to re-run.

-- Categories: approval flag + author tracking (existing rows stay approved)
alter table public.categories
  add column if not exists approved boolean not null default true;
alter table public.categories
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

-- Subcategories (e.g. "Süd məhsulları" > "Pendir")
create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name_az text not null,
  slug text not null,
  sort_order int not null default 0,
  approved boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

create index if not exists subcategories_category_id_idx on public.subcategories (category_id);

alter table public.subcategories enable row level security;

drop policy if exists "Subcategories are public" on public.subcategories;
create policy "Subcategories are public"
on public.subcategories for select
using (true);

drop policy if exists "Admins manage subcategories" on public.subcategories;
create policy "Admins manage subcategories"
on public.subcategories for all
using (public.is_admin())
with check (public.is_admin());

-- Products link to a subcategory (enforced as required in the app, nullable for legacy rows)
alter table public.products
  add column if not exists subcategory_id uuid references public.subcategories (id) on delete set null;

create index if not exists products_subcategory_id_idx on public.products (subcategory_id);

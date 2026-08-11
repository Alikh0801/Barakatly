-- Subcategories + farmer-submitted category/subcategory approval workflow

-- Categories: approval flag + author tracking (existing rows stay approved)
alter table public.categories
  add column approved boolean not null default true,
  add column created_by uuid references public.profiles (id) on delete set null;

-- Subcategories (e.g. "Süd məhsulları" > "Pendir")
create table public.subcategories (
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

create index subcategories_category_id_idx on public.subcategories (category_id);

alter table public.subcategories enable row level security;

create policy "Subcategories are public"
on public.subcategories for select
using (true);

create policy "Admins manage subcategories"
on public.subcategories for all
using (public.is_admin())
with check (public.is_admin());

-- Products link to a subcategory (enforced as required in the app, nullable for legacy rows)
alter table public.products
  add column subcategory_id uuid references public.subcategories (id) on delete set null;

create index products_subcategory_id_idx on public.products (subcategory_id);

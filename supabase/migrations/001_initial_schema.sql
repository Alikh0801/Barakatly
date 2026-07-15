-- BARAKATLY initial schema
-- Run in Supabase SQL Editor or via Supabase CLI

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'farmer', 'courier', 'admin');

create type public.farmer_status as enum (
  'pending',
  'approved',
  'rejected',
  'suspended'
);

create type public.product_status as enum ('pending', 'approved', 'rejected');

create type public.unit_type as enum ('kg', 'piece', 'liter');

create type public.order_status as enum (
  'awaiting_confirmation',
  'confirmed',
  'farmer_accepted',
  'preparing',
  'picked_up',
  'delivered',
  'cancelled'
);

create type public.order_item_status as enum (
  'new',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'delivered'
);

create type public.payment_status as enum ('pending', 'confirmed', 'rejected');

create type public.notification_type as enum (
  'farmer_registration',
  'farmer_approval',
  'product_submission',
  'product_approval',
  'payment_received',
  'order_confirmed',
  'order_prepared',
  'order_picked_up',
  'order_delivered',
  'general'
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- Farmers
-- ---------------------------------------------------------------------------
create table public.farmers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  farm_name text not null,
  description text,
  location_text text,
  location_lat double precision,
  location_lng double precision,
  location_map_url text,
  status public.farmer_status not null default 'pending',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index farmers_status_idx on public.farmers (status);
create index farmers_profile_id_idx on public.farmers (profile_id);

-- ---------------------------------------------------------------------------
-- Couriers (admin-created accounts)
-- ---------------------------------------------------------------------------
create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_az text not null,
  icon text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  title text not null,
  description text not null,
  unit_type public.unit_type not null,
  farmer_price numeric(10, 2) not null check (farmer_price >= 0),
  final_price numeric(10, 2) check (final_price >= 0),
  quantity_available numeric(10, 2) not null default 0 check (quantity_available >= 0),
  in_stock boolean not null default true,
  status public.product_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_farmer_id_idx on public.products (farmer_id);
create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);

-- ---------------------------------------------------------------------------
-- Product images
-- ---------------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- ---------------------------------------------------------------------------
-- Banks (manual payment)
-- ---------------------------------------------------------------------------
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pan_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  status public.order_status not null default 'awaiting_confirmation',
  contact_phone text not null,
  delivery_address_text text,
  delivery_lat double precision,
  delivery_lng double precision,
  delivery_map_url text,
  subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null default 5 check (delivery_fee >= 0),
  total_amount numeric(10, 2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_order_code_idx on public.orders (order_code);

-- ---------------------------------------------------------------------------
-- Order items (split per farmer)
-- ---------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  product_title text not null,
  quantity numeric(10, 2) not null check (quantity > 0),
  unit_type public.unit_type not null,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  status public.order_item_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_farmer_id_idx on public.order_items (farmer_id);
create index order_items_status_idx on public.order_items (status);

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  bank_id uuid not null references public.banks (id),
  receipt_url text,
  status public.payment_status not null default 'pending',
  confirmed_by uuid references public.profiles (id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_status_idx on public.payments (status);

-- ---------------------------------------------------------------------------
-- Order status history
-- ---------------------------------------------------------------------------
create table public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid references public.order_items (id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index order_status_events_order_id_idx on public.order_status_events (order_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type public.notification_type not null default 'general',
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_read_at_idx on public.notifications (read_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger farmers_set_updated_at
before update on public.farmers
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger order_items_set_updated_at
before update on public.order_items
for each row execute function public.set_updated_at();

create or replace function public.generate_order_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  code := 'BRK-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  return code;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role public.user_role;
begin
  user_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    'customer'::public.user_role
  );

  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    user_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.phone
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'::public.user_role
  );
$$;

create or replace function public.is_farmer_owner(target_farmer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farmers f
    join public.profiles p on p.id = f.profile_id
    where f.id = target_farmer_id and p.id = auth.uid()
  );
$$;

create or replace function public.is_courier()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'courier'::public.user_role
  );
$$;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('farmer-photos', 'farmer-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

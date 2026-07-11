-- BARAKATLY Row Level Security policies

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.farmers enable row level security;
alter table public.couriers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.banks enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_events enable row level security;
alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create policy "Profiles are viewable by owner or admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can update any profile"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Farmers
-- ---------------------------------------------------------------------------
create policy "Approved farmers are public"
on public.farmers for select
using (status = 'approved'::public.farmer_status or auth.uid() = profile_id or public.is_admin());

create policy "Farmers can insert own profile"
on public.farmers for insert
with check (auth.uid() = profile_id);

create policy "Farmers can update own record"
on public.farmers for update
using (auth.uid() = profile_id or public.is_admin())
with check (auth.uid() = profile_id or public.is_admin());

create policy "Admins manage farmers"
on public.farmers for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Couriers
-- ---------------------------------------------------------------------------
create policy "Couriers viewable by admin or self"
on public.couriers for select
using (
  public.is_admin()
  or profile_id = auth.uid()
);

create policy "Admins manage couriers"
on public.couriers for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create policy "Categories are public"
on public.categories for select
using (true);

create policy "Admins manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create policy "Approved products are public"
on public.products for select
using (
  status = 'approved'::public.product_status
  or public.is_farmer_owner(farmer_id)
  or public.is_admin()
);

create policy "Farmers can insert own products"
on public.products for insert
with check (public.is_farmer_owner(farmer_id));

create policy "Farmers can update own products"
on public.products for update
using (public.is_farmer_owner(farmer_id) or public.is_admin())
with check (public.is_farmer_owner(farmer_id) or public.is_admin());

create policy "Admins manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Product images
-- ---------------------------------------------------------------------------
create policy "Product images follow product visibility"
on public.product_images for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (
        p.status = 'approved'::public.product_status
        or public.is_farmer_owner(p.farmer_id)
        or public.is_admin()
      )
  )
);

create policy "Farmers manage own product images"
on public.product_images for all
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
);

-- ---------------------------------------------------------------------------
-- Banks
-- ---------------------------------------------------------------------------
create policy "Active banks are public"
on public.banks for select
using (is_active = true or public.is_admin());

create policy "Admins manage banks"
on public.banks for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create policy "Customers view own orders"
on public.orders for select
using (customer_id = auth.uid() or public.is_admin() or public.is_courier());

create policy "Customers create own orders"
on public.orders for insert
with check (customer_id = auth.uid());

create policy "Admins and couriers update orders"
on public.orders for update
using (public.is_admin() or public.is_courier())
with check (public.is_admin() or public.is_courier());

create policy "Admins manage orders"
on public.orders for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Order items
-- ---------------------------------------------------------------------------
create policy "Order items visible to relevant parties"
on public.order_items for select
using (
  public.is_admin()
  or public.is_courier()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
  or public.is_farmer_owner(farmer_id)
);

create policy "Customers insert order items via order"
on public.order_items for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

create policy "Farmers update own order items"
on public.order_items for update
using (public.is_farmer_owner(farmer_id) or public.is_admin() or public.is_courier())
with check (public.is_farmer_owner(farmer_id) or public.is_admin() or public.is_courier());

create policy "Admins manage order items"
on public.order_items for all
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
create policy "Customers view own payments"
on public.payments for select
using (
  public.is_admin()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

create policy "Customers create own payments"
on public.payments for insert
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

create policy "Admins manage payments"
on public.payments for update
using (public.is_admin())
with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Order status events
-- ---------------------------------------------------------------------------
create policy "Status events visible to order parties"
on public.order_status_events for select
using (
  public.is_admin()
  or public.is_courier()
  or exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
  or exists (
    select 1 from public.order_items oi
    where oi.order_id = order_id and public.is_farmer_owner(oi.farmer_id)
  )
);

create policy "Authenticated users insert status events"
on public.order_status_events for insert
with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create policy "Users view own notifications"
on public.notifications for select
using (user_id = auth.uid());

create policy "Users update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "System inserts notifications for authenticated users"
on public.notifications for insert
with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------
create policy "Public read product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Farmers upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.uid() is not null
);

create policy "Farmers update own product images"
on storage.objects for update
using (bucket_id = 'product-images' and auth.uid() = owner)
with check (bucket_id = 'product-images' and auth.uid() = owner);

create policy "Customers upload payment receipts"
on storage.objects for insert
with check (
  bucket_id = 'payment-receipts'
  and auth.uid() is not null
);

create policy "Receipt access for customer and admin"
on storage.objects for select
using (
  bucket_id = 'payment-receipts'
  and (auth.uid() = owner or public.is_admin())
);

create policy "Public read farmer photos"
on storage.objects for select
using (bucket_id = 'farmer-photos');

create policy "Farmers upload own photos"
on storage.objects for insert
with check (
  bucket_id = 'farmer-photos'
  and auth.uid() is not null
);

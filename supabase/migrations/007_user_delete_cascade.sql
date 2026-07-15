-- When a user is deleted from auth.users → profiles cascade,
-- also remove (or detach) all related site data.

-- Customer orders
alter table public.orders
  drop constraint if exists orders_customer_id_fkey;

alter table public.orders
  add constraint orders_customer_id_fkey
  foreign key (customer_id)
  references public.profiles (id)
  on delete cascade;

-- Farmer / product history on order lines
alter table public.order_items
  drop constraint if exists order_items_farmer_id_fkey;

alter table public.order_items
  add constraint order_items_farmer_id_fkey
  foreign key (farmer_id)
  references public.farmers (id)
  on delete cascade;

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id)
  references public.products (id)
  on delete cascade;

-- Optional profile refs on shared records: clear instead of blocking delete
alter table public.payments
  drop constraint if exists payments_confirmed_by_fkey;

alter table public.payments
  add constraint payments_confirmed_by_fkey
  foreign key (confirmed_by)
  references public.profiles (id)
  on delete set null;

alter table public.order_status_events
  drop constraint if exists order_status_events_changed_by_fkey;

alter table public.order_status_events
  add constraint order_status_events_changed_by_fkey
  foreign key (changed_by)
  references public.profiles (id)
  on delete set null;

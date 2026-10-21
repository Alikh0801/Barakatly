-- ---------------------------------------------------------------------------
-- Row-level policies say whose rows a user may update, not which columns.
-- With the public API key anyone signed in could, from the browser:
--   * make themselves admin (profiles.role), or sign up with role "admin";
--   * approve their own farm or products, set a product's final price;
--   * rewrite prices and totals on order lines and orders;
--   * send notifications to anyone and add events to any order.
-- The app never does these, but the database allowed them. Below, triggers
-- refuse such changes unless they come from an admin or from the server
-- (service role, or a security definer function such as place_order), and
-- the two insert policies are narrowed to the roles that use them.
-- ---------------------------------------------------------------------------

-- True for admins and for anything not running as a signed-in API user:
-- the service role, the SQL editor, and security definer functions (which
-- run as their owner). Deliberately not security definer itself, so
-- current_user is the caller's.
create or replace function public.is_privileged_writer()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select current_user not in ('anon', 'authenticated') or public.is_admin();
$$;

-- ---------------------------------------------------------------------------
-- Sign-up: the role comes from here, never from what the client sends. The
-- app always signs people up as customers; admins promote them later.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    'customer'::public.user_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.phone
  );

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: users edit their name and phone, never their role.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_privileged_writer()
     and (new.role is distinct from old.role or new.id is distinct from old.id) then
    raise exception 'NOT_ALLOWED: role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
before update on public.profiles
for each row execute function public.guard_profiles_update();

-- ---------------------------------------------------------------------------
-- farmers: a farmer applies as pending and proposes profile edits in the
-- pending_* columns; the admin approves both.
-- ---------------------------------------------------------------------------
create or replace function public.guard_farmers_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.verified_at := null;
    return new;
  end if;

  if new.status is distinct from old.status
     or new.verified_at is distinct from old.verified_at
     or new.profile_id is distinct from old.profile_id
     or new.farm_name is distinct from old.farm_name
     or new.description is distinct from old.description
     or new.location_text is distinct from old.location_text
     or new.location_lat is distinct from old.location_lat
     or new.location_lng is distinct from old.location_lng
     or new.location_map_url is distinct from old.location_map_url
     or new.avatar_url is distinct from old.avatar_url
     or new.cover_url is distinct from old.cover_url then
    raise exception 'NOT_ALLOWED: farmer fields need admin approval';
  end if;
  return new;
end;
$$;

drop trigger if exists farmers_guard_write on public.farmers;
create trigger farmers_guard_write
before insert or update on public.farmers
for each row execute function public.guard_farmers_write();

-- ---------------------------------------------------------------------------
-- products: new and edited products wait for the admin, who alone sets the
-- final price. A farmer may take an approved product off sale and back.
-- ---------------------------------------------------------------------------
create or replace function public.guard_products_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.final_price := null;
    new.sold_count := 0;
    new.rating_average := null;
    new.rating_count := 0;
    return new;
  end if;

  if new.farmer_id is distinct from old.farmer_id
     or new.sold_count is distinct from old.sold_count
     or new.rating_average is distinct from old.rating_average
     or new.rating_count is distinct from old.rating_count then
    raise exception 'NOT_ALLOWED: product fields';
  end if;

  -- Only clearing the final price (an edit sends the product back to review).
  if new.final_price is distinct from old.final_price and new.final_price is not null then
    raise exception 'NOT_ALLOWED: final price';
  end if;

  if new.status is distinct from old.status
     and not (
       new.status = 'pending'
       or (old.status = 'approved' and new.status = 'archived')
       or (old.status = 'archived' and new.status = 'approved')
     ) then
    raise exception 'NOT_ALLOWED: product status';
  end if;
  return new;
end;
$$;

drop trigger if exists products_guard_write on public.products;
create trigger products_guard_write
before insert or update on public.products
for each row execute function public.guard_products_write();

-- ---------------------------------------------------------------------------
-- order_items: farmers and couriers move a line's status along its steps;
-- what was bought and for how much never changes.
-- ---------------------------------------------------------------------------
create or replace function public.guard_order_items_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_step text := old.status::text || '>' || new.status::text;
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if new.order_id is distinct from old.order_id
     or new.farmer_id is distinct from old.farmer_id
     or new.product_id is distinct from old.product_id
     or new.product_title is distinct from old.product_title
     or new.quantity is distinct from old.quantity
     or new.unit_type is distinct from old.unit_type
     or new.unit_size is distinct from old.unit_size
     or new.unit_price is distinct from old.unit_price
     or new.line_total is distinct from old.line_total
     or new.created_at is distinct from old.created_at then
    raise exception 'NOT_ALLOWED: order line fields';
  end if;

  if new.cancel_reason is distinct from old.cancel_reason and new.status <> 'cancelled' then
    raise exception 'NOT_ALLOWED: cancel reason';
  end if;

  if new.status is distinct from old.status then
    if public.is_courier() then
      if v_step not in ('ready>picked_up', 'awaiting_pickup>picked_up', 'picked_up>delivered') then
        raise exception 'NOT_ALLOWED: order line status';
      end if;
    elsif v_step not in (
      'new>accepted', 'accepted>preparing', 'preparing>ready', 'ready>awaiting_pickup',
      'new>cancelled', 'accepted>cancelled', 'preparing>cancelled', 'ready>cancelled'
    ) then
      raise exception 'NOT_ALLOWED: order line status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_guard_update on public.order_items;
create trigger order_items_guard_update
before update on public.order_items
for each row execute function public.guard_order_items_update();

-- ---------------------------------------------------------------------------
-- orders: couriers take an order and move its status; the money, the
-- customer and the delivery details stay as placed.
-- ---------------------------------------------------------------------------
create or replace function public.guard_orders_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if new.customer_id is distinct from old.customer_id
     or new.order_code is distinct from old.order_code
     or new.subtotal is distinct from old.subtotal
     or new.delivery_fee is distinct from old.delivery_fee
     or new.total_amount is distinct from old.total_amount
     or new.discount_amount is distinct from old.discount_amount
     or new.promo_code_id is distinct from old.promo_code_id
     or new.promo_code is distinct from old.promo_code
     or new.contact_phone is distinct from old.contact_phone
     or new.delivery_address_text is distinct from old.delivery_address_text
     or new.recipient_first_name is distinct from old.recipient_first_name
     or new.recipient_last_name is distinct from old.recipient_last_name
     or new.delivery_city is distinct from old.delivery_city
     or new.delivery_district is distinct from old.delivery_district
     or new.order_note is distinct from old.order_note
     or new.created_at is distinct from old.created_at then
    raise exception 'NOT_ALLOWED: order fields';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_update on public.orders;
create trigger orders_guard_update
before update on public.orders
for each row execute function public.guard_orders_update();

-- ---------------------------------------------------------------------------
-- Notifications and order events are written by admins, couriers and
-- farmers (about their own lines); customers only get them.
-- ---------------------------------------------------------------------------
drop policy if exists "System inserts notifications for authenticated users" on public.notifications;
drop policy if exists "Staff insert notifications" on public.notifications;
create policy "Staff insert notifications"
on public.notifications for insert
with check (
  user_id = auth.uid()
  or public.is_admin()
  or public.is_courier()
  or public.current_user_role() = 'farmer'::public.user_role
);

drop policy if exists "Authenticated users insert status events" on public.order_status_events;
drop policy if exists "Staff insert status events" on public.order_status_events;
create policy "Staff insert status events"
on public.order_status_events for insert
with check (
  public.is_admin()
  or public.is_courier()
  or exists (
    select 1 from public.order_items oi
    where oi.order_id = order_status_events.order_id
      and public.is_farmer_owner(oi.farmer_id)
  )
);

-- ---------------------------------------------------------------------------
-- The six-argument place_order() kept by migration 043 for the minutes
-- between that migration and its deploy; the site only calls the new one.
-- ---------------------------------------------------------------------------
drop function if exists public.place_order(text, text, uuid, text, jsonb, text);

-- ---------------------------------------------------------------------------
-- Order rows: who may write what (OWASP A08-002, A01-005).
--
-- 1. is_courier() only looked at profiles.role. Switching a courier off in
--    the admin panel (couriers.is_active = false) closed the courier pages
--    but not the API, where that courier still read every order's names,
--    phones and addresses and could keep moving orders along. It now also
--    wants an active couriers row; every policy that calls it follows.
--
-- 2. The site writes only status and cancel_reason on order_items and only
--    status and courier_id on orders (farmer/actions.ts, courier/actions.ts,
--    admin/actions.ts). API users keep update on exactly those columns, so
--    prices, amounts, customers and addresses can't be touched whatever a
--    policy allows. Functions and triggers that run as their owner
--    (place_order, cancel cascades, payouts) are unaffected. Migration 048's
--    guard triggers stay as the second line.
--
-- 3. guard_orders_update() let a courier set an order to any status, and
--    to drop a claim. A courier may now take only the steps of the courier
--    panel (awaiting_courier > picked_up > delivered / cancelled), and only
--    put their own id in courier_id.
-- ---------------------------------------------------------------------------

create or replace function public.is_courier()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.couriers c on c.profile_id = p.id
    where p.id = auth.uid()
      and p.role = 'courier'::public.user_role
      and c.is_active
  );
$$;

revoke update on public.orders, public.order_items from anon, authenticated;
grant update (status, courier_id) on public.orders to authenticated;
grant update (status, cancel_reason) on public.order_items to authenticated;

create or replace function public.guard_orders_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.customer_id is distinct from old.customer_id
     or new.order_code is distinct from old.order_code
     or new.subtotal is distinct from old.subtotal
     or new.delivery_fee is distinct from old.delivery_fee
     or new.total_amount is distinct from old.total_amount
     or new.discount_amount is distinct from old.discount_amount
     or new.promo_code_id is distinct from old.promo_code_id
     or new.promo_code is distinct from old.promo_code
     or new.contact_phone is distinct from old.contact_phone
     or new.delivery_address_text is distinct from old.delivery_address_text
     or new.delivery_lat is distinct from old.delivery_lat
     or new.delivery_lng is distinct from old.delivery_lng
     or new.delivery_map_url is distinct from old.delivery_map_url
     or new.recipient_first_name is distinct from old.recipient_first_name
     or new.recipient_last_name is distinct from old.recipient_last_name
     or new.delivery_city is distinct from old.delivery_city
     or new.delivery_district is distinct from old.delivery_district
     or new.order_note is distinct from old.order_note
     or new.created_at is distinct from old.created_at then
    raise exception 'NOT_ALLOWED: order fields';
  end if;

  if new.courier_id is distinct from old.courier_id
     and new.courier_id is distinct from public.my_courier_id() then
    raise exception 'NOT_ALLOWED: order courier';
  end if;

  if new.status is distinct from old.status
     and (old.status::text || '>' || new.status::text) not in (
       'awaiting_courier>picked_up', 'picked_up>delivered', 'picked_up>cancelled'
     ) then
    raise exception 'NOT_ALLOWED: order status';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_orders_update() from public, anon, authenticated;

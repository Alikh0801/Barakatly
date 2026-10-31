-- ---------------------------------------------------------------------------
-- The courier's pick-up goes through the admin, and the farmer's last step
-- is "kuryer gözləyir".
--
-- * Picking up no longer moves the order: the courier claims it and marks
--   its lines picked up, and the admin then shows the customer "Kuryer yola
--   çıxdı" (as with the farmers' marks). guard_orders_update() drops the
--   courier's awaiting_courier > picked_up step; delivering or failing to
--   deliver may now start from awaiting_courier as well as picked_up, and
--   only on an order the courier holds.
-- * Farmers stop at "awaiting_pickup": guard_order_items_update() drops the
--   farmer's awaiting_pickup > picked_up step (the courier keeps it).
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

  -- A courier picks up by claiming the order and marking its lines; the
  -- admin shows "Kuryer yola çıxdı". The courier closes the order
  -- (delivered, or could not deliver) only once it is theirs.
  if new.status is distinct from old.status
     and ((old.status::text || '>' || new.status::text) not in (
            'awaiting_courier>delivered', 'awaiting_courier>cancelled',
            'picked_up>delivered', 'picked_up>cancelled'
          )
          or new.courier_id is distinct from public.my_courier_id()) then
    raise exception 'NOT_ALLOWED: order status';
  end if;

  return new;
end;
$$;

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
     or new.variant_id is distinct from old.variant_id
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

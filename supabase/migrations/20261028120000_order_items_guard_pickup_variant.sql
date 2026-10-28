-- ---------------------------------------------------------------------------
-- Two fixes to guard_order_items_update() from migration 048:
--   * the farmer panel lets a farmer mark a line handed to the courier
--     (awaiting_pickup -> picked_up, FARMER_ITEM_STATUS_TRANSITIONS), but the
--     guard allowed that step to couriers only, so the button failed;
--   * a line's size (variant_id, migration 20261027120000) was not locked,
--     and the farmer's payout is priced from it, so a farmer could switch
--     their own line to a dearer size.
-- Otherwise as in 048. Run after 048.
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
      'awaiting_pickup>picked_up',
      'new>cancelled', 'accepted>cancelled', 'preparing>cancelled', 'ready>cancelled'
    ) then
      raise exception 'NOT_ALLOWED: order line status';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_order_items_update() from public, anon, authenticated;

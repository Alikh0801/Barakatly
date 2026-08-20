-- ---------------------------------------------------------------------------
-- Cascades order cancellation to its order_items automatically, so a
-- farmer's dashboard stops showing a cancelled order's items as active
-- work. Fires no matter which code path cancels the order (payment
-- rejection, admin status change, or anything added later). Already
-- delivered items are left untouched.
--
-- Split into its own migration because Postgres won't let a new enum value
-- (order_item_status.cancelled, added in 023) be referenced in the same
-- transaction that added it.
-- ---------------------------------------------------------------------------
create or replace function public.cascade_cancel_order_items()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.order_items
  set status = 'cancelled'
  where order_id = new.id
    and status not in ('delivered', 'cancelled');
  return new;
end;
$$;

drop trigger if exists orders_cancel_cascade on public.orders;

create trigger orders_cancel_cascade
after update of status on public.orders
for each row
when (new.status = 'cancelled' and old.status is distinct from 'cancelled')
execute function public.cascade_cancel_order_items();

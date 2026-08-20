-- ---------------------------------------------------------------------------
-- Cancelling an order (payment rejection or admin status change) decremented
-- stock at checkout time but never gave it back — cancelled orders
-- permanently shrank inventory even though nothing was ever shipped.
-- Extends the cascade trigger from 024 (same automatic-on-any-cancellation
-- guarantee) to also restore quantity_available/in_stock for every item
-- actually moving to cancelled. Already-delivered items are excluded, same
-- as the status cascade — that stock was genuinely sold.
-- ---------------------------------------------------------------------------
create or replace function public.cascade_cancel_order_items()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.products p
  set quantity_available = p.quantity_available + oi.quantity,
      in_stock = true
  from public.order_items oi
  where oi.order_id = new.id
    and oi.status not in ('delivered', 'cancelled')
    and oi.product_id = p.id;

  update public.order_items
  set status = 'cancelled'
  where order_id = new.id
    and status not in ('delivered', 'cancelled');

  return new;
end;
$$;

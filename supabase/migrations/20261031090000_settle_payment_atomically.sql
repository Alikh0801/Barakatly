-- ---------------------------------------------------------------------------
-- Confirming or rejecting a payment in one transaction (OWASP A10-001).
--
-- The admin actions checked "pending" in JavaScript and then wrote payments
-- and orders as two separate requests, neither conditioned on the status.
-- If the second write failed, the payment was settled while the order
-- still waited (and a retry said "already processed"; a rejected order kept
-- its stock). Two admins clicking at once could leave the payment rejected
-- and the order confirmed, sending farmers an unpaid order.
--
-- These functions lock the payment row, act only on a pending payment, and
-- write the payment and the order together: both or neither. A second
-- click waits for the first and then gets ALREADY_SETTLED. Notifications
-- stay in the app, after the function has succeeded.
-- ---------------------------------------------------------------------------

create or replace function public.confirm_payment(p_payment_id uuid)
returns table (order_id uuid, customer_id uuid, order_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if v_payment.status <> 'pending' then
    raise exception 'ALREADY_SETTLED';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if v_order.status <> 'awaiting_confirmation' then
    raise exception 'ORDER_NOT_AWAITING';
  end if;

  update public.payments
     set status = 'confirmed', confirmed_by = auth.uid(), confirmed_at = now()
   where id = p_payment_id;

  update public.orders set status = 'confirmed' where id = v_order.id;

  return query select v_order.id, v_order.customer_id, v_order.order_code;
end;
$$;

create or replace function public.reject_payment(p_payment_id uuid)
returns table (order_id uuid, customer_id uuid, order_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if v_payment.status <> 'pending' then
    raise exception 'ALREADY_SETTLED';
  end if;

  -- An order the admin already cancelled may still have its payment
  -- pending; rejecting it just settles the payment.
  select * into v_order from public.orders where id = v_payment.order_id for update;
  if v_order.status not in ('awaiting_confirmation', 'cancelled') then
    raise exception 'ORDER_NOT_AWAITING';
  end if;

  update public.payments
     set status = 'rejected', confirmed_by = auth.uid(), confirmed_at = now()
   where id = p_payment_id;

  -- orders_cancel_cascade cancels the lines and puts the stock back.
  update public.orders set status = 'cancelled' where id = v_order.id and status <> 'cancelled';

  return query select v_order.id, v_order.customer_id, v_order.order_code;
end;
$$;

revoke execute on function public.confirm_payment(uuid), public.reject_payment(uuid) from public, anon;
grant execute on function public.confirm_payment(uuid), public.reject_payment(uuid) to authenticated;

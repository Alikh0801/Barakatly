-- ---------------------------------------------------------------------------
-- Fix 1: atomic checkout to eliminate the stock overselling race.
--
-- The previous flow validated stock, then created the order/items/payment,
-- then decremented stock as a best-effort step afterwards (errors were only
-- logged). Two concurrent checkouts for the last unit of a product could
-- both pass validation and both get a successful order, overselling the
-- product. place_order() does everything — product lock, validation,
-- pricing, order/items/payment insert, stock decrement — inside a single
-- transaction. Any stock shortfall raises an exception and the whole
-- transaction rolls back, so no order is ever created without real stock
-- backing it.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_customer_id uuid,
  p_contact_phone text,
  p_delivery_address_text text,
  p_bank_id uuid,
  p_receipt_url text,
  p_delivery_fee numeric,
  p_items jsonb
)
returns table (order_id uuid, order_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order_code text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_product record;
  v_quantity numeric;
  v_unit_price numeric;
  v_line_total numeric;
  v_farmer_ids uuid[] := '{}';
  v_product_ids uuid[] := '{}';
  v_titles text[] := '{}';
  v_quantities numeric[] := '{}';
  v_unit_types public.unit_type[] := '{}';
  v_unit_prices numeric[] := '{}';
  v_line_totals numeric[] := '{}';
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- Lock every involved product row up front, in a stable (id-sorted) order,
  -- so two concurrent checkouts touching an overlapping cart can't deadlock.
  perform 1
  from public.products
  where id in (
    select (value ->> 'product_id')::uuid
    from jsonb_array_elements(p_items)
  )
  order by id
  for update;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::numeric;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select id, farmer_id, title, unit_type, final_price, farmer_price,
           quantity_available, in_stock, status
      into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    if v_product.status <> 'approved' then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    if not v_product.in_stock or v_product.quantity_available < v_quantity then
      raise exception 'OUT_OF_STOCK:%', v_product.title;
    end if;

    v_unit_price := coalesce(v_product.final_price, v_product.farmer_price);
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    v_farmer_ids := v_farmer_ids || v_product.farmer_id;
    v_product_ids := v_product_ids || v_product.id;
    v_titles := v_titles || v_product.title;
    v_quantities := v_quantities || v_quantity;
    v_unit_types := v_unit_types || v_product.unit_type;
    v_unit_prices := v_unit_prices || v_unit_price;
    v_line_totals := v_line_totals || v_line_total;

    update public.products
      set quantity_available = quantity_available - v_quantity,
          in_stock = (quantity_available - v_quantity) > 0
      where id = v_product.id;
  end loop;

  v_total := v_subtotal + p_delivery_fee;
  v_order_code := public.generate_order_code();

  insert into public.orders
    (order_code, customer_id, contact_phone, delivery_address_text,
     subtotal, delivery_fee, total_amount, status)
  values
    (v_order_code, p_customer_id, p_contact_phone, p_delivery_address_text,
     v_subtotal, p_delivery_fee, v_total, 'awaiting_confirmation')
  returning id into v_order_id;

  insert into public.order_items
    (order_id, farmer_id, product_id, product_title, quantity, unit_type,
     unit_price, line_total, status)
  select v_order_id, f, p, t, q, u, up, lt, 'new'
  from unnest(
    v_farmer_ids, v_product_ids, v_titles, v_quantities,
    v_unit_types, v_unit_prices, v_line_totals
  ) as x(f, p, t, q, u, up, lt);

  insert into public.payments (order_id, bank_id, receipt_url, status)
  values (v_order_id, p_bank_id, p_receipt_url, 'pending');

  insert into public.order_status_events (order_id, status, changed_by, note)
  values (v_order_id, 'awaiting_confirmation', p_customer_id, 'Sifariş yaradıldı');

  return query select v_order_id, v_order_code;
end;
$$;

grant execute on function public.place_order(
  uuid, text, text, uuid, text, numeric, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Fix 2: cancelling an order left its order_items stuck on their old status
-- (e.g. "new"/"preparing"), so a farmer's dashboard kept showing a cancelled
-- order's items as active work. Add a terminal 'cancelled' item status and a
-- trigger that cascades it automatically whenever an order is cancelled,
-- regardless of which code path did the cancelling. Already-delivered items
-- are left alone — cancellation shouldn't rewrite completed history.
-- ---------------------------------------------------------------------------
alter type public.order_item_status add value if not exists 'cancelled';

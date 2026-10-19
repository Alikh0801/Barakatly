-- ---------------------------------------------------------------------------
-- Checkout asks for the recipient's name, the city and district, and an
-- optional note for the farmer or courier. They are stored on the order, so
-- the courier and the admin see who receives it and where, and the
-- customer's earlier addresses can be offered again next time.
-- ---------------------------------------------------------------------------

alter table public.orders
  add column if not exists recipient_first_name text
    check (recipient_first_name is null or char_length(recipient_first_name) between 1 and 50),
  add column if not exists recipient_last_name text
    check (recipient_last_name is null or char_length(recipient_last_name) between 1 and 50),
  add column if not exists delivery_city text
    check (delivery_city is null or char_length(delivery_city) between 1 and 60),
  add column if not exists delivery_district text
    check (delivery_district is null or char_length(delivery_district) <= 80),
  add column if not exists order_note text
    check (order_note is null or char_length(order_note) <= 500);

-- ---------------------------------------------------------------------------
-- place_order() with the new details. Same as migration 042 otherwise:
-- the customer comes from the session, the delivery fee from here, and the
-- promo code is judged in the same transaction.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_contact_phone text,
  p_delivery_address_text text,
  p_bank_id uuid,
  p_receipt_url text,
  p_items jsonb,
  p_promo_code text,
  p_first_name text,
  p_last_name text,
  p_city text,
  p_district text,
  p_note text
)
returns table (order_id uuid, order_code text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c_delivery_fee constant numeric := 5;
  v_customer_id uuid := auth.uid();
  v_order_id uuid;
  v_order_code text;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_promo_id uuid;
  v_promo_code text;
  v_promo record;
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
  if v_customer_id is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

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

  if nullif(btrim(coalesce(p_promo_code, '')), '') is not null then
    select * into v_promo
      from public.evaluate_promo_code(p_promo_code, v_customer_id, v_subtotal, true);
    if v_promo.error is not null then
      -- Rolls back everything above, stock included.
      raise exception 'PROMO_%', v_promo.error;
    end if;
    v_promo_id := v_promo.promo_id;
    v_promo_code := v_promo.code;
    v_discount := v_promo.discount;
  end if;

  v_total := v_subtotal - v_discount + c_delivery_fee;
  v_order_code := public.generate_order_code();

  insert into public.orders
    (order_code, customer_id, contact_phone, delivery_address_text,
     subtotal, delivery_fee, total_amount, status,
     promo_code_id, promo_code, discount_amount,
     recipient_first_name, recipient_last_name, delivery_city,
     delivery_district, order_note)
  values
    (v_order_code, v_customer_id, p_contact_phone, p_delivery_address_text,
     v_subtotal, c_delivery_fee, v_total, 'awaiting_confirmation',
     v_promo_id, v_promo_code, v_discount,
     nullif(btrim(p_first_name), ''), nullif(btrim(p_last_name), ''),
     nullif(btrim(p_city), ''), nullif(btrim(p_district), ''),
     nullif(btrim(p_note), ''))
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
  values (v_order_id, 'awaiting_confirmation', v_customer_id, 'Sifariş yaradıldı');

  return query select v_order_id, v_order_code;
end;
$$;

revoke execute on function public.place_order(text, text, uuid, text, jsonb, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.place_order(text, text, uuid, text, jsonb, text, text, text, text, text, text)
  to authenticated;

-- The six-argument version from migration 042 stays for now, as a thin
-- wrapper, so the live site keeps taking orders in the minutes between this
-- migration and the deploy that sends the new details. A later migration
-- can drop it.
create or replace function public.place_order(
  p_contact_phone text,
  p_delivery_address_text text,
  p_bank_id uuid,
  p_receipt_url text,
  p_items jsonb,
  p_promo_code text default null
)
returns table (order_id uuid, order_code text)
language sql
security definer
set search_path = public, pg_temp
as $$
  select * from public.place_order(
    p_contact_phone, p_delivery_address_text, p_bank_id, p_receipt_url,
    p_items, p_promo_code, null::text, null::text, null::text, null::text, null::text
  );
$$;

-- ---------------------------------------------------------------------------
-- place_order() repeats the checkout action's checks (OWASP A06-001).
--
-- Anyone signed in can call /rest/v1/rpc/place_order directly. Prices,
-- stock and promo codes were already worked out inside the function, but
-- four checks lived only in lib/checkout/actions.ts, so a direct call could
-- skip them: a farmer could buy their own products (sold_count, reviews),
-- an amount could go below the minimum or off the unit's steps, the bank
-- could be inactive, and p_receipt_url could be any text. The function now
-- refuses those itself, and limits the free-text fields as the form does:
--   INVALID_DETAILS, BANK_NOT_FOUND, RECEIPT_NOT_FOUND, RECEIPT_TOO_LARGE,
--   RECEIPT_TYPE, OWN_PRODUCT, QUANTITY_RULE:<title>.
-- Same signature, so the existing grants stay.
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
  v_variant record;
  v_variant_id uuid;
  v_quantity numeric;
  v_unit_price numeric;
  v_line_total numeric;
  v_farmer_ids uuid[] := '{}';
  v_product_ids uuid[] := '{}';
  v_variant_ids uuid[] := '{}';
  v_titles text[] := '{}';
  v_quantities numeric[] := '{}';
  v_unit_types public.unit_type[] := '{}';
  v_unit_sizes text[] := '{}';
  v_unit_prices numeric[] := '{}';
  v_line_totals numeric[] := '{}';
  v_own_farmer_id uuid;
  v_receipt record;
  v_step integer;
  v_hundredths numeric;
begin
  if v_customer_id is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- The checks the checkout action makes, repeated here for whoever calls
  -- /rest/v1/rpc/place_order directly. Limits as in lib/checkout/constants.
  if nullif(btrim(coalesce(p_delivery_address_text, '')), '') is null
     or length(p_delivery_address_text) > 300
     or nullif(btrim(coalesce(p_first_name, '')), '') is null
     or nullif(btrim(coalesce(p_last_name, '')), '') is null
     or length(p_first_name) > 50 or length(p_last_name) > 50
     or nullif(btrim(coalesce(p_city, '')), '') is null or length(p_city) > 80
     or length(coalesce(p_district, '')) > 80
     or length(coalesce(p_note, '')) > 500
     or coalesce(p_contact_phone, '') !~ '^\+994[0-9]{9}$' then
    raise exception 'INVALID_DETAILS';
  end if;

  if not exists (select 1 from public.banks where id = p_bank_id and is_active) then
    raise exception 'BANK_NOT_FOUND';
  end if;

  -- The receipt: in the caller's own folder, really uploaded by them, and
  -- an image or PDF of at most 7 MB.
  if coalesce(p_receipt_url, '') !~ ('^' || v_customer_id::text || '/[A-Za-z0-9_-]+\.(jpg|png|webp|pdf)$') then
    raise exception 'RECEIPT_NOT_FOUND';
  end if;
  select o.metadata into v_receipt
    from storage.objects o
    where o.bucket_id = 'payment-receipts' and o.name = p_receipt_url and o.owner = v_customer_id;
  if not found then
    raise exception 'RECEIPT_NOT_FOUND';
  end if;
  if coalesce((v_receipt.metadata ->> 'size')::bigint, 0) > 7 * 1024 * 1024 then
    raise exception 'RECEIPT_TOO_LARGE';
  end if;
  if coalesce(v_receipt.metadata ->> 'mimetype', '') not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
    raise exception 'RECEIPT_TYPE';
  end if;

  select id into v_own_farmer_id from public.farmers where profile_id = v_customer_id;

  -- Lock every involved size up front, in a stable (id-sorted) order, so two
  -- concurrent checkouts touching an overlapping cart can't deadlock.
  perform 1
  from public.product_variants
  where id in (
    select coalesce(nullif(value ->> 'variant_id', '')::uuid,
                    public.default_variant_id((value ->> 'product_id')::uuid))
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

    select id, farmer_id, title, status, min_order_quantity
      into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid;

    if not found or v_product.status <> 'approved' then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    -- A farmer can't buy their own products (sold_count, reviews).
    if v_product.farmer_id = v_own_farmer_id then
      raise exception 'OWN_PRODUCT';
    end if;

    v_variant_id := coalesce(nullif(v_item ->> 'variant_id', '')::uuid,
                             public.default_variant_id(v_product.id));

    select id, unit_type, unit_size, final_price, farmer_price, quantity_available, in_stock
      into v_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product.id;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;

    -- On the unit's steps (50 qr, 0,5 l, whole units) and at least the
    -- farmer's minimum, as lib/shop/quantity.ts.
    v_step := case v_variant.unit_type when 'kg' then 5 when 'liter' then 50 else 100 end;
    v_hundredths := v_quantity * 100;
    if v_hundredths <> trunc(v_hundredths)
       or v_hundredths::bigint % v_step <> 0
       or v_quantity < greatest(v_step / 100.0, coalesce(v_product.min_order_quantity, 0)) then
      raise exception 'QUANTITY_RULE:%', v_product.title;
    end if;

    if not v_variant.in_stock or v_variant.quantity_available < v_quantity then
      raise exception 'OUT_OF_STOCK:%', v_product.title;
    end if;

    v_unit_price := coalesce(v_variant.final_price, v_variant.farmer_price);
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    v_farmer_ids := v_farmer_ids || v_product.farmer_id;
    v_product_ids := v_product_ids || v_product.id;
    v_variant_ids := v_variant_ids || v_variant.id;
    v_titles := v_titles || v_product.title;
    v_quantities := v_quantities || v_quantity;
    v_unit_types := v_unit_types || v_variant.unit_type;
    v_unit_sizes := v_unit_sizes || v_variant.unit_size;
    v_unit_prices := v_unit_prices || v_unit_price;
    v_line_totals := v_line_totals || v_line_total;

    update public.product_variants
      set quantity_available = quantity_available - v_quantity
      where id = v_variant.id;
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
    (order_id, farmer_id, product_id, variant_id, product_title, quantity, unit_type,
     unit_size, unit_price, line_total, status)
  select v_order_id, f, p, v, t, q, u, s, up, lt, 'new'
  from unnest(
    v_farmer_ids, v_product_ids, v_variant_ids, v_titles, v_quantities,
    v_unit_types, v_unit_sizes, v_unit_prices, v_line_totals
  ) as x(f, p, v, t, q, u, s, up, lt);

  insert into public.payments (order_id, bank_id, receipt_url, status)
  values (v_order_id, p_bank_id, p_receipt_url, 'pending');

  insert into public.order_status_events (order_id, status, changed_by, note)
  values (v_order_id, 'awaiting_confirmation', v_customer_id, 'Sifariş yaradıldı');

  return query select v_order_id, v_order_code;
end;
$$;


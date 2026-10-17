-- ---------------------------------------------------------------------------
-- Promo codes ("Promokodlar").
--
-- The admin creates codes; a customer applies one in the cart. The discount
-- comes off the products' subtotal (never the delivery fee) and is checked
-- again inside place_order(), in the same transaction that creates the
-- order, so the browser can never set its own discount. Farmers' line totals
-- are untouched: the platform carries the discount.
-- ---------------------------------------------------------------------------

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  -- What the customer types, stored in capitals: "YAY10".
  code text not null unique
    check (code ~ '^[A-Z0-9_-]{3,30}$'),
  -- The admin's own name for it: "Yay kampaniyası".
  name text not null check (char_length(btrim(name)) between 1 and 80),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  -- The last moment the code works; null = no end date.
  expires_at timestamptz,
  -- Orders that may use it in total; null = no limit.
  max_uses integer check (max_uses is null or max_uses > 0),
  once_per_customer boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100)
);

alter table public.promo_codes enable row level security;

-- Only admins see the list. Customers check a code through check_promo_code(),
-- which says whether it works without revealing the others.
drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes"
on public.promo_codes for all
using (public.is_admin())
with check (public.is_admin());

alter table public.orders
  add column if not exists promo_code_id uuid references public.promo_codes (id) on delete set null,
  -- Kept as text too, so an order still says which code it used after the
  -- code itself is deleted.
  add column if not exists promo_code text,
  add column if not exists discount_amount numeric(10, 2) not null default 0
    check (discount_amount >= 0);

create index if not exists orders_promo_code_id_idx
  on public.orders (promo_code_id) where promo_code_id is not null;

-- ---------------------------------------------------------------------------
-- The one place a code is judged. Not callable from the API: it trusts the
-- customer id and subtotal it is given.
--
-- Returns the discount, or an error code:
--   NOT_FOUND, EXPIRED, MIN_ORDER, USED_UP, ALREADY_USED.
-- Cancelled orders don't count as uses.
-- ---------------------------------------------------------------------------
create or replace function public.evaluate_promo_code(
  p_code text,
  p_customer_id uuid,
  p_subtotal numeric,
  p_lock boolean default false
)
returns table (
  promo_id uuid,
  code text,
  name text,
  discount numeric,
  error text,
  min_order_amount numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_promo public.promo_codes%rowtype;
  v_uses integer;
  v_discount numeric;
begin
  if p_lock then
    -- Serialises checkouts using the same code, so the last free use of a
    -- limited code can't be taken twice.
    select * into v_promo from public.promo_codes
      where promo_codes.code = upper(btrim(p_code)) for update;
  else
    select * into v_promo from public.promo_codes
      where promo_codes.code = upper(btrim(p_code));
  end if;

  if not found or not v_promo.is_active then
    return query select null::uuid, upper(btrim(p_code)), null::text, 0::numeric, 'NOT_FOUND', null::numeric;
    return;
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return query select v_promo.id, v_promo.code, v_promo.name, 0::numeric, 'EXPIRED', null::numeric;
    return;
  end if;

  if p_subtotal < v_promo.min_order_amount then
    return query select v_promo.id, v_promo.code, v_promo.name, 0::numeric, 'MIN_ORDER', v_promo.min_order_amount;
    return;
  end if;

  if v_promo.max_uses is not null then
    select count(*) into v_uses from public.orders o
      where o.promo_code_id = v_promo.id and o.status <> 'cancelled';
    if v_uses >= v_promo.max_uses then
      return query select v_promo.id, v_promo.code, v_promo.name, 0::numeric, 'USED_UP', null::numeric;
      return;
    end if;
  end if;

  if v_promo.once_per_customer and exists (
    select 1 from public.orders o
    where o.promo_code_id = v_promo.id
      and o.customer_id = p_customer_id
      and o.status <> 'cancelled'
  ) then
    return query select v_promo.id, v_promo.code, v_promo.name, 0::numeric, 'ALREADY_USED', null::numeric;
    return;
  end if;

  if v_promo.discount_type = 'percent' then
    v_discount := round(p_subtotal * v_promo.discount_value / 100, 2);
  else
    v_discount := v_promo.discount_value;
  end if;
  -- Never more than the products cost.
  v_discount := least(v_discount, p_subtotal);

  return query select v_promo.id, v_promo.code, v_promo.name, v_discount, null::text, null::numeric;
end;
$$;

revoke execute on function public.evaluate_promo_code(text, uuid, numeric, boolean)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- For the cart and checkout pages: judges a code against the signed-in
-- customer's own cart, priced exactly as place_order() prices it.
-- ---------------------------------------------------------------------------
create or replace function public.check_promo_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer uuid := auth.uid();
  v_subtotal numeric;
  v_result record;
begin
  if v_customer is null then
    return jsonb_build_object('error', 'NOT_SIGNED_IN');
  end if;

  select coalesce(sum(coalesce(p.final_price, p.farmer_price) * c.quantity), 0)
    into v_subtotal
    from public.cart_items c
    join public.products p on p.id = c.product_id
    where c.customer_id = v_customer
      and c.quantity > 0
      and p.status = 'approved';

  select * into v_result
    from public.evaluate_promo_code(p_code, v_customer, v_subtotal);

  return jsonb_build_object(
    'code', v_result.code,
    'name', v_result.name,
    'discount', v_result.discount,
    'subtotal', v_subtotal,
    'error', v_result.error,
    'min_order_amount', v_result.min_order_amount
  );
end;
$$;

revoke execute on function public.check_promo_code(text) from public, anon;
grant execute on function public.check_promo_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- place_order() with an optional promo code.
--
-- Also closes two gaps in the old version: it took the customer id and the
-- delivery fee from its caller, so a signed-in user calling the API directly
-- could order in someone else's name or with no delivery fee. Both now come
-- from the session and from here. DELIVERY_FEE in src/lib/checkout/constants.ts
-- must match.
-- ---------------------------------------------------------------------------
drop function if exists public.place_order(uuid, text, text, uuid, text, numeric, jsonb);

create or replace function public.place_order(
  p_contact_phone text,
  p_delivery_address_text text,
  p_bank_id uuid,
  p_receipt_url text,
  p_items jsonb,
  p_promo_code text default null
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
     promo_code_id, promo_code, discount_amount)
  values
    (v_order_code, v_customer_id, p_contact_phone, p_delivery_address_text,
     v_subtotal, c_delivery_fee, v_total, 'awaiting_confirmation',
     v_promo_id, v_promo_code, v_discount)
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

revoke execute on function public.place_order(text, text, uuid, text, jsonb, text)
  from public, anon;
grant execute on function public.place_order(text, text, uuid, text, jsonb, text)
  to authenticated;

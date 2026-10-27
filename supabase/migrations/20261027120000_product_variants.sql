-- ---------------------------------------------------------------------------
-- Sizes of one product ("banka (kq)" and "banka 1,5 kq" of the same
-- Gavalı tutması) live in product_variants, each with its own unit, size,
-- price, final price, stock and photo. A product card shows them as buttons
-- instead of the shop listing every size as a separate product.
--
-- products keeps its unit, price and stock columns as a mirror of the
-- default size (the first one in stock), so lists, stats and anything else
-- reading products keep working; products.in_stock is false only when every
-- size is sold out. cart_items and order_items gain variant_id.
--
-- Same-name approved products of one farmer whose sizes all differ are
-- merged into the oldest one. To see what that does before running this:
--
--   with g as (
--     select p.farmer_id, lower(btrim(p.title)) as name
--     from public.products p
--     where p.status = 'approved'
--     group by 1, 2
--     having count(*) > 1
--        and count(distinct (p.unit_type, coalesce(p.unit_size, ''))) = count(*)
--   )
--   select pr.full_name as farmer, p.title, p.unit_type, p.unit_size,
--          coalesce(p.final_price, p.farmer_price) as price, p.quantity_available,
--          case when p.created_at = min(p.created_at) over (partition by p.farmer_id, g.name)
--               then 'qalır' else 'ölçü kimi birləşir, satışdan çıxır' end as olacaq
--   from g
--   join public.products p on p.farmer_id = g.farmer_id and lower(btrim(p.title)) = g.name
--                          and p.status = 'approved'
--   join public.farmers f on f.id = p.farmer_id
--   join public.profiles pr on pr.id = f.profile_id
--   order by farmer, p.title, p.created_at;
-- ---------------------------------------------------------------------------

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  unit_type public.unit_type not null,
  unit_size text check (unit_size is null or char_length(unit_size) between 1 and 30),
  farmer_price numeric(10, 2) not null check (farmer_price >= 0),
  final_price numeric(10, 2) check (final_price is null or final_price >= 0),
  quantity_available numeric(10, 2) not null default 0 check (quantity_available >= 0),
  in_stock boolean not null default false,
  sort_order int not null default 0,
  -- The photo shown when this size is picked; null means the product's first.
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_variants_product_idx
  on public.product_variants (product_id, sort_order);
-- One button per unit and size.
create unique index if not exists product_variants_unit_key
  on public.product_variants (product_id, unit_type, coalesce(unit_size, ''));

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

-- in_stock follows the stock, as on products (migration 034).
drop trigger if exists product_variants_sync_in_stock on public.product_variants;
create trigger product_variants_sync_in_stock
before insert or update of quantity_available, in_stock on public.product_variants
for each row execute function public.sync_product_in_stock();

-- ---------------------------------------------------------------------------
-- RLS: visible like the product; written by its farmer or an admin.
-- ---------------------------------------------------------------------------
alter table public.product_variants enable row level security;

drop policy if exists "Product variants follow product visibility" on public.product_variants;
create policy "Product variants follow product visibility"
on public.product_variants for select
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and (p.status = 'approved' or public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
);

drop policy if exists "Farmers manage own product variants" on public.product_variants;
create policy "Farmers manage own product variants"
on public.product_variants for all
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and (public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_id and (public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
);

-- Only an admin sets the final price; a farmer may only clear it (an edit
-- sends the product back to review). Not SECURITY DEFINER: current_user must
-- be the caller's role.
create or replace function public.guard_product_variants_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.final_price := null;
    return new;
  end if;
  if new.product_id is distinct from old.product_id then
    raise exception 'NOT_ALLOWED: variant product';
  end if;
  if new.final_price is distinct from old.final_price and new.final_price is not null then
    raise exception 'NOT_ALLOWED: final price';
  end if;
  return new;
end;
$$;

drop trigger if exists product_variants_guard_write on public.product_variants;
create trigger product_variants_guard_write
before insert or update on public.product_variants
for each row execute function public.guard_product_variants_write();

-- ---------------------------------------------------------------------------
-- products mirrors its default size: the first in stock, else the first.
-- ---------------------------------------------------------------------------
create or replace function public.sync_product_from_variants(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v record;
begin
  select * into v
    from public.product_variants
    where product_id = p_product_id
    order by (quantity_available > 0) desc, sort_order, created_at
    limit 1;
  if not found then
    return;
  end if;
  update public.products
     set unit_type = v.unit_type,
         unit_size = v.unit_size,
         farmer_price = v.farmer_price,
         final_price = v.final_price,
         quantity_available = v.quantity_available
   where id = p_product_id
     and (unit_type, unit_size, farmer_price, final_price, quantity_available)
         is distinct from (v.unit_type, v.unit_size, v.farmer_price, v.final_price, v.quantity_available);
end;
$$;

create or replace function public.product_variants_sync_product()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op <> 'INSERT' then
    perform public.sync_product_from_variants(old.product_id);
  end if;
  if tg_op <> 'DELETE' and (tg_op = 'INSERT' or new.product_id is distinct from old.product_id) then
    perform public.sync_product_from_variants(new.product_id);
  end if;
  return null;
end;
$$;

drop trigger if exists product_variants_sync_product on public.product_variants;
create trigger product_variants_sync_product
after insert or update or delete on public.product_variants
for each row execute function public.product_variants_sync_product();

-- ---------------------------------------------------------------------------
-- Every existing product gets its one size.
-- ---------------------------------------------------------------------------
insert into public.product_variants
  (product_id, unit_type, unit_size, farmer_price, final_price, quantity_available, sort_order)
select p.id, p.unit_type, p.unit_size, p.farmer_price, p.final_price, p.quantity_available, 0
from public.products p
where not exists (select 1 from public.product_variants v where v.product_id = p.id);

-- A product saved without sizes (by code from before this migration) gets
-- one from its own columns; the farmer form adds the rest after the insert.
create or replace function public.products_add_default_variant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.product_variants where product_id = new.id) then
    insert into public.product_variants
      (product_id, unit_type, unit_size, farmer_price, final_price, quantity_available, sort_order)
    values
      (new.id, new.unit_type, new.unit_size, new.farmer_price, new.final_price, new.quantity_available, 0);
  end if;
  return null;
end;
$$;

drop trigger if exists products_add_default_variant on public.products;
create trigger products_add_default_variant
after insert on public.products
for each row execute function public.products_add_default_variant();

-- ---------------------------------------------------------------------------
-- cart_items and order_items point at a size.
-- ---------------------------------------------------------------------------
alter table public.cart_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete cascade;
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null;

update public.cart_items c
   set variant_id = v.id
  from public.product_variants v
 where c.variant_id is null and v.product_id = c.product_id;

update public.order_items oi
   set variant_id = v.id
  from public.product_variants v
 where oi.variant_id is null and v.product_id = oi.product_id;

-- One cart row per size now, not per product.
alter table public.cart_items drop constraint if exists cart_items_customer_id_product_id_key;
create unique index if not exists cart_items_customer_variant_key
  on public.cart_items (customer_id, variant_id);
create index if not exists order_items_variant_idx on public.order_items (variant_id);

-- A row written without a size (code from before this migration, in the
-- minutes before the deploy) gets the product's default one.
create or replace function public.default_variant_id(p_product_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.product_variants
  where product_id = p_product_id
  order by (quantity_available > 0) desc, sort_order, created_at
  limit 1;
$$;

create or replace function public.cart_items_fill_variant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.variant_id is null then
    new.variant_id := public.default_variant_id(new.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists cart_items_fill_variant on public.cart_items;
create trigger cart_items_fill_variant
before insert on public.cart_items
for each row execute function public.cart_items_fill_variant();

-- The line keeps its own size (migration 046 copied it from the product).
create or replace function public.order_items_copy_unit_size()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.variant_id is null then
    new.variant_id := public.default_variant_id(new.product_id);
  end if;
  if new.unit_size is null then
    if new.variant_id is not null then
      select v.unit_size into new.unit_size
        from public.product_variants v where v.id = new.variant_id;
    else
      select p.unit_size into new.unit_size
        from public.products p where p.id = new.product_id;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Merge same-name approved products of one farmer into the oldest one, each
-- becoming one of its sizes (with its own photo). The others go off sale
-- ("archived") but stay, so past orders still point at them.
-- ---------------------------------------------------------------------------
do $merge$
declare
  g record;
  dup record;
  v_order int;
  v_image_order int;
begin
  for g in
    select p.farmer_id, lower(btrim(p.title)) as name,
           (array_agg(p.id order by p.created_at, p.id))[1] as keeper_id
    from public.products p
    where p.status = 'approved'
    group by 1, 2
    having count(*) > 1
       and count(distinct (p.unit_type, coalesce(p.unit_size, ''))) = count(*)
  loop
    -- The keeper's own size shows its first photo.
    update public.product_variants v
       set image_url = (select i.url from public.product_images i
                         where i.product_id = g.keeper_id order by i.sort_order, i.created_at limit 1)
     where v.product_id = g.keeper_id and v.image_url is null;

    v_order := 0;
    for dup in
      select p.* from public.products p
      where p.farmer_id = g.farmer_id and lower(btrim(p.title)) = g.name
        and p.status = 'approved' and p.id <> g.keeper_id
      order by p.created_at, p.id
    loop
      v_order := v_order + 1;
      select coalesce(max(sort_order), -1) + 1 into v_image_order
        from public.product_images where product_id = g.keeper_id;

      -- Its photos join the keeper's gallery; its size points at the first.
      insert into public.product_images (product_id, url, sort_order)
      select g.keeper_id, i.url, v_image_order + row_number() over (order by i.sort_order, i.created_at) - 1
      from public.product_images i where i.product_id = dup.id;

      update public.product_variants v
         set product_id = g.keeper_id,
             sort_order = v_order,
             image_url = coalesce(v.image_url, (select i.url from public.product_images i
                                                 where i.product_id = dup.id
                                                 order by i.sort_order, i.created_at limit 1))
       where v.product_id = dup.id;

      update public.cart_items set product_id = g.keeper_id where product_id = dup.id;

      insert into public.wishlist_items (customer_id, product_id, created_at)
      select w.customer_id, g.keeper_id, w.created_at from public.wishlist_items w where w.product_id = dup.id
      on conflict do nothing;
      delete from public.wishlist_items where product_id = dup.id;

      update public.products
         set sold_count = sold_count + coalesce(dup.sold_count, 0)
       where id = g.keeper_id;
      update public.products set status = 'archived' where id = dup.id;
    end loop;

    perform public.sync_product_from_variants(g.keeper_id);
  end loop;
end
$merge$;

-- ---------------------------------------------------------------------------
-- place_order(): each line names its size (variant_id); its price, unit and
-- stock come from that size. A line without one gets the default size.
-- Otherwise as in migration 043.
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
begin
  if v_customer_id is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

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

    select id, farmer_id, title, status
      into v_product
      from public.products
      where id = (v_item ->> 'product_id')::uuid;

    if not found or v_product.status <> 'approved' then
      raise exception 'PRODUCT_NOT_FOUND';
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

-- ---------------------------------------------------------------------------
-- A cancelled order's stock goes back to its sizes (migration 025 put it
-- back on the product).
-- ---------------------------------------------------------------------------
create or replace function public.cascade_cancel_order_items()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.product_variants v
  set quantity_available = v.quantity_available + oi.quantity
  from public.order_items oi
  where oi.order_id = new.id
    and oi.status not in ('delivered', 'cancelled')
    and oi.variant_id = v.id;

  -- Lines whose size was deleted since.
  update public.products p
  set quantity_available = p.quantity_available + oi.quantity,
      in_stock = true
  from public.order_items oi
  where oi.order_id = new.id
    and oi.status not in ('delivered', 'cancelled')
    and oi.variant_id is null
    and oi.product_id = p.id;

  update public.order_items
  set status = 'cancelled'
  where order_id = new.id
    and status not in ('delivered', 'cancelled');

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Farmer payouts (where present) price each line at its size's farmer price.
-- Otherwise unchanged from migration 20261025115108.
-- ---------------------------------------------------------------------------
do $payouts$
begin
  if to_regprocedure('public.create_farmer_payouts(uuid)') is not null then
    execute $fn$
      create or replace function public.create_farmer_payouts(p_order_id uuid) returns integer
      language plpgsql security definer set search_path = public as $body$
      declare
        f record;
        v_payout uuid;
        v_count integer := 0;
      begin
        for f in
          select distinct oi.farmer_id
          from order_items oi
          where oi.order_id = p_order_id and oi.status <> 'cancelled'
            and not exists (select 1 from farmer_payouts fp where fp.order_id = p_order_id and fp.farmer_id = oi.farmer_id)
        loop
          insert into farmer_payouts (order_id, farmer_id, bank_name, pan_number)
          select p_order_id, f.farmer_id, a.bank_name, a.pan_number
          from (select 1) x
          left join farmer_payout_accounts a on a.farmer_id = f.farmer_id and a.is_active
          returning id into v_payout;

          insert into farmer_payout_items (payout_id, order_item_id, product_id, product_title, unit_type, unit_size, quantity, farmer_unit_price, line_total)
          select v_payout, oi.id, oi.product_id, oi.product_title, oi.unit_type::text, oi.unit_size, oi.quantity,
                 coalesce(v.farmer_price, p.farmer_price, 0),
                 round(oi.quantity * coalesce(v.farmer_price, p.farmer_price, 0), 2)
          from order_items oi
          left join product_variants v on v.id = oi.variant_id
          left join products p on p.id = oi.product_id
          where oi.order_id = p_order_id and oi.farmer_id = f.farmer_id and oi.status <> 'cancelled';

          update farmer_payouts
             set amount = (select coalesce(sum(line_total), 0) from farmer_payout_items where payout_id = v_payout)
           where id = v_payout;
          v_count := v_count + 1;
        end loop;
        return v_count;
      end $body$;
    $fn$;
    execute 'revoke all on function public.create_farmer_payouts(uuid) from public, anon, authenticated';
  end if;
end
$payouts$;

-- Trigger and helper functions are not for the API.
revoke execute on function public.guard_product_variants_write() from public, anon, authenticated;
revoke execute on function public.sync_product_from_variants(uuid) from public, anon, authenticated;
revoke execute on function public.product_variants_sync_product() from public, anon, authenticated;
revoke execute on function public.cart_items_fill_variant() from public, anon, authenticated;
revoke execute on function public.default_variant_id(uuid) from public, anon, authenticated;
revoke execute on function public.products_add_default_variant() from public, anon, authenticated;
revoke execute on function public.order_items_copy_unit_size() from public, anon, authenticated;
revoke execute on function public.cascade_cancel_order_items() from public, anon, authenticated;

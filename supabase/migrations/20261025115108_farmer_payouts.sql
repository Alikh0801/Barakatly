-- Farmer payout card (where Barakatly sends the farmer's share)
create table public.farmer_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null unique references public.farmers(id) on delete cascade,
  bank_name text not null,
  pan_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One payout per farmer per order
create table public.farmer_payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  farmer_id uuid not null references public.farmers(id) on delete restrict,
  amount numeric(12,2) not null default 0,
  bank_name text,
  pan_number text,
  status text not null default 'pending' check (status in ('pending','paid')),
  paid_at timestamptz,
  paid_by uuid references public.profiles(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, farmer_id)
);
create index farmer_payouts_status_idx on public.farmer_payouts(status);
create index farmer_payouts_farmer_idx on public.farmer_payouts(farmer_id);

-- Lines the payout is made of (farmer price snapshot)
create table public.farmer_payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.farmer_payouts(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  product_id uuid,
  product_title text not null,
  unit_type text,
  unit_size text,
  quantity numeric(12,3) not null,
  farmer_unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index farmer_payout_items_payout_idx on public.farmer_payout_items(payout_id);

-- RLS: admins everything, a farmer only reads their own rows
alter table public.farmer_payout_accounts enable row level security;
alter table public.farmer_payouts enable row level security;
alter table public.farmer_payout_items enable row level security;

create policy "Admins manage payout accounts" on public.farmer_payout_accounts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Farmers view own payout account" on public.farmer_payout_accounts
  for select using (public.is_farmer_owner(farmer_id));

create policy "Admins manage payouts" on public.farmer_payouts
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Farmers view own payouts" on public.farmer_payouts
  for select using (public.is_farmer_owner(farmer_id));

create policy "Admins manage payout items" on public.farmer_payout_items
  for all using (public.is_admin()) with check (public.is_admin());
create policy "Farmers view own payout items" on public.farmer_payout_items
  for select using (exists (
    select 1 from public.farmer_payouts fp
    where fp.id = farmer_payout_items.payout_id and public.is_farmer_owner(fp.farmer_id)));

-- updated_at
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

create trigger farmer_payout_accounts_touch before update on public.farmer_payout_accounts
  for each row execute function public.touch_updated_at();
create trigger farmer_payouts_touch before update on public.farmer_payouts
  for each row execute function public.touch_updated_at();

-- Build payouts for an order (idempotent: skips farmers that already have one)
create or replace function public.create_farmer_payouts(p_order_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
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
           coalesce(p.farmer_price, 0), round(oi.quantity * coalesce(p.farmer_price, 0), 2)
    from order_items oi left join products p on p.id = oi.product_id
    where oi.order_id = p_order_id and oi.farmer_id = f.farmer_id and oi.status <> 'cancelled';

    update farmer_payouts
       set amount = (select coalesce(sum(line_total), 0) from farmer_payout_items where payout_id = v_payout)
     where id = v_payout;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

revoke all on function public.create_farmer_payouts(uuid) from public, anon, authenticated;

-- Fire when a payment becomes confirmed
create or replace function public.payments_create_farmer_payouts() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status is distinct from 'confirmed') then
    perform public.create_farmer_payouts(new.order_id);
  end if;
  return new;
end $$;

create trigger payments_farmer_payouts
  after insert or update of status on public.payments
  for each row execute function public.payments_create_farmer_payouts();

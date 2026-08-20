-- ---------------------------------------------------------------------------
-- No order was ever assigned to a specific courier — RLS let ANY active
-- courier update ANY order, so two couriers opening the queue at the same
-- moment could both "pick up" the same order (double-processing, duplicate
-- customer notifications, no accountability for who actually has it).
--
-- Adds orders.courier_id, claimed on the courier's first action (moving an
-- order to "picked_up"). Once claimed, RLS only lets that same courier
-- (or an admin) touch the order — a second courier's claim attempt affects
-- zero rows instead of racing the first one.
-- ---------------------------------------------------------------------------
alter table public.orders
  add column courier_id uuid references public.couriers (id) on delete set null;

create index orders_courier_id_idx on public.orders (courier_id);

create or replace function public.my_courier_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.couriers where profile_id = auth.uid();
$$;

drop policy if exists "Admins and couriers update orders" on public.orders;

create policy "Admins and couriers update orders"
on public.orders for update
using (
  public.is_admin()
  or (
    public.is_courier()
    and (courier_id is null or courier_id = public.my_courier_id())
  )
)
with check (
  public.is_admin()
  or (
    public.is_courier()
    and (courier_id is null or courier_id = public.my_courier_id())
  )
);

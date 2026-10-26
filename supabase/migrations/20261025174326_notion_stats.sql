create table if not exists public.notion_sync_state (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);
alter table public.notion_sync_state enable row level security;
revoke all on public.notion_sync_state from anon, authenticated;

create or replace function public.notion_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  with real_orders as (
    select o.* from orders o
    where o.order_code not like 'BRK-TEST%'
      and o.status <> 'cancelled'
      and not exists (select 1 from payments p where p.order_id = o.id and p.status = 'rejected')
  ),
  unit_az(u, az) as (values ('kg','kq'),('piece','ədəd'),('liter','L'),('jar','banka'),('glass','stəkan'),('bunch','dəstə')),
  added as (
    select p.title,
           count(distinct p.farmer_id) farmers,
           sum(p.quantity_available) stock,
           case when count(distinct p.unit_type) = 1 then max(ua.az) end unit
    from products p
    join farmers f on f.id = p.farmer_id and f.status = 'approved'
    left join unit_az ua on ua.u = p.unit_type::text
    where p.status = 'approved'
    group by p.title
    order by farmers desc, stock desc nulls last, p.title
    limit 7
  ),
  sold as (
    select oi.product_title title,
           count(distinct oi.order_id) orders,
           sum(oi.quantity) qty,
           case when count(distinct oi.unit_type) = 1 then max(ua.az) end unit,
           sum(oi.line_total) revenue
    from order_items oi
    join real_orders r on r.id = oi.order_id
    left join unit_az ua on ua.u = oi.unit_type::text
    where oi.status <> 'cancelled'
    group by oi.product_title
    order by orders desc, revenue desc, oi.product_title
    limit 5
  )
  select jsonb_build_object(
    'customers', (select count(*) from profiles where role = 'customer'),
    'customers_ordered', (select count(distinct r.customer_id) from real_orders r
                          join profiles pr on pr.id = r.customer_id and pr.role = 'customer'),
    'orders', (select count(*) from real_orders),
    'revenue', (select coalesce(sum(total_amount), 0) from real_orders),
    'farmers', (select count(*) from farmers where status = 'approved'),
    'added', coalesce((select jsonb_agg(to_jsonb(a)) from added a), '[]'::jsonb),
    'sold', coalesce((select jsonb_agg(to_jsonb(s)) from sold s), '[]'::jsonb)
  );
$$;
revoke all on function public.notion_stats() from public, anon, authenticated;

create or replace function public.trg_notion_stats_ping()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform ping_notion_sync();
  return null;
end $$;
revoke all on function public.trg_notion_stats_ping() from public, anon, authenticated;

drop trigger if exists notion_stats_profiles on public.profiles;
create trigger notion_stats_profiles after insert or update of role on public.profiles
  for each row execute function public.trg_notion_stats_ping();
drop trigger if exists notion_stats_farmers on public.farmers;
create trigger notion_stats_farmers after insert or update of status on public.farmers
  for each row execute function public.trg_notion_stats_ping();

select cron.schedule('notion-stats-refresh', '*/10 * * * *', $$ select public.ping_notion_sync() $$);

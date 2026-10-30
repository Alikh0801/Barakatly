create extension if not exists pg_net;

create table if not exists public.notion_sync_queue (
  id bigserial primary key,
  order_id uuid not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  processed_at timestamptz,
  attempts int not null default 0,
  last_error text
);
create index if not exists notion_sync_queue_pending_idx
  on public.notion_sync_queue (order_id) where processed_at is null;

create table if not exists public.notion_sync_map (
  kind text not null check (kind in ('order','item','payout')),
  ref_id uuid not null,
  notion_page_id text not null,
  props_hash text,
  receipt_key text,
  updated_at timestamptz not null default now(),
  primary key (kind, ref_id)
);

alter table public.notion_sync_queue enable row level security;
alter table public.notion_sync_map enable row level security;
revoke all on public.notion_sync_queue, public.notion_sync_map from anon, authenticated;

create or replace function public.ping_notion_sync()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://stvlelyrtqtwmejvbydc.supabase.co/functions/v1/notion-sync',
    body := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
end $$;

create or replace function public.enqueue_notion_sync(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_order_id is null then return; end if;
  if not exists (select 1 from notion_sync_queue
                 where order_id = p_order_id and processed_at is null and claimed_at is null) then
    insert into notion_sync_queue(order_id) values (p_order_id);
  end if;
  perform ping_notion_sync();
end $$;

create or replace function public.trg_notion_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'orders' then
    perform enqueue_notion_sync(new.id);
  else
    perform enqueue_notion_sync(new.order_id);
  end if;
  return null;
end $$;

drop trigger if exists notion_sync_orders on public.orders;
create trigger notion_sync_orders after insert or update on public.orders
  for each row execute function public.trg_notion_sync();
drop trigger if exists notion_sync_order_items on public.order_items;
create trigger notion_sync_order_items after insert or update on public.order_items
  for each row execute function public.trg_notion_sync();
drop trigger if exists notion_sync_payments on public.payments;
create trigger notion_sync_payments after insert or update on public.payments
  for each row execute function public.trg_notion_sync();
drop trigger if exists notion_sync_farmer_payouts on public.farmer_payouts;
create trigger notion_sync_farmer_payouts after insert or update on public.farmer_payouts
  for each row execute function public.trg_notion_sync();

create or replace function public.claim_notion_sync(p_limit int default 10)
returns table(queue_id bigint, order_id uuid)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with picked as (
    select distinct on (q.order_id) q.id
    from notion_sync_queue q
    where q.processed_at is null and q.claimed_at is null and q.attempts < 10
      and not exists (select 1 from notion_sync_queue b
                      where b.order_id = q.order_id and b.processed_at is null
                        and b.claimed_at > now() - interval '3 minutes')
    order by q.order_id, q.id
    limit p_limit
  )
  update notion_sync_queue q
     set claimed_at = now(), attempts = q.attempts + 1
    from picked where q.id = picked.id
  returning q.id, q.order_id;
end $$;

create or replace function public.finish_notion_sync(p_queue_id bigint, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_error is null then
    update notion_sync_queue set processed_at = now(), last_error = null where id = p_queue_id;
  else
    update notion_sync_queue set claimed_at = null, last_error = left(p_error, 1000) where id = p_queue_id;
  end if;
end $$;

revoke all on function public.ping_notion_sync(), public.enqueue_notion_sync(uuid),
  public.claim_notion_sync(int), public.finish_notion_sync(bigint, text) from public, anon, authenticated;

select cron.schedule('notion-sync-retry', '* * * * *',
  $$ select public.ping_notion_sync()
     where exists (select 1 from public.notion_sync_queue
                   where processed_at is null and attempts < 10
                     and (claimed_at is null or claimed_at < now() - interval '3 minutes')) $$);

select cron.schedule('notion-sync-unstick', '*/5 * * * *',
  $$ update public.notion_sync_queue set claimed_at = null
     where processed_at is null and claimed_at < now() - interval '3 minutes' $$);

-- ---------------------------------------------------------------------------
-- A record of what admins do, and of failed sign-in attempts.
--
-- Approving, rejecting or deleting a farmer, creating a courier, promo
-- codes, payouts and deleting orders left no trace of who did them or when.
-- Deleting an order also took its history with it: order_status_events
-- (payment confirmed, every status change), the payment and the lines all
-- go by `on delete cascade`.
--
-- audit_log keeps one row per action. The app writes admin actions and
-- failed sign-ins with the service role (lib/audit/log.ts), after it has
-- checked who is asking. Nobody can change or remove a row through the API:
-- the API roles have no write grants, and a trigger refuses UPDATE and
-- DELETE for every role but the database owner (the SQL editor).
-- Admins can read it.
--
-- An order deleted any way at all (the admin panel, or a cascade from a
-- deleted account) is copied into audit_log first, with its lines, payment
-- and status history. The admin panel now deletes through
-- admin_delete_orders(), which runs as the signed-in admin, so the copy
-- carries their id.
-- ---------------------------------------------------------------------------

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- No foreign key: the record must outlive the account that made it.
  actor_id uuid,
  actor_email text,
  action text not null check (char_length(action) between 1 and 64),
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index if not exists audit_log_target_idx on public.audit_log (target_type, target_id);
create index if not exists audit_log_action_idx on public.audit_log (action, created_at desc);

alter table public.audit_log enable row level security;

revoke all on table public.audit_log from public, anon, authenticated;
grant select on table public.audit_log to authenticated;
grant select, insert on table public.audit_log to service_role;

drop policy if exists "Admins read audit log" on public.audit_log;
create policy "Admins read audit log"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

-- Append-only, for the service role too.
create or replace function public.guard_audit_log_append_only()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin') then
    return coalesce(new, old);
  end if;
  raise exception 'NOT_ALLOWED: audit log is append-only';
end;
$$;

revoke execute on function public.guard_audit_log_append_only() from public, anon, authenticated;

drop trigger if exists audit_log_append_only on public.audit_log;
create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each row execute function public.guard_audit_log_append_only();

-- ---------------------------------------------------------------------------
-- A deleted order is copied into audit_log first.
-- ---------------------------------------------------------------------------

create or replace function public.audit_order_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
begin
  insert into public.audit_log (actor_id, actor_email, action, target_type, target_id, details)
  values (
    v_actor,
    (select email from public.profiles where id = v_actor),
    'order.deleted',
    'order',
    old.id::text,
    jsonb_build_object(
      'order', to_jsonb(old),
      'items', coalesce(
        (select jsonb_agg(to_jsonb(i) order by i.created_at) from public.order_items i where i.order_id = old.id),
        '[]'::jsonb
      ),
      'payment', (select to_jsonb(p) from public.payments p where p.order_id = old.id),
      'events', coalesce(
        (select jsonb_agg(to_jsonb(e) order by e.created_at) from public.order_status_events e where e.order_id = old.id),
        '[]'::jsonb
      )
    )
  );
  return old;
end;
$$;

revoke execute on function public.audit_order_delete() from public, anon, authenticated;

drop trigger if exists orders_audit_delete on public.orders;
create trigger orders_audit_delete
  before delete on public.orders
  for each row execute function public.audit_order_delete();

-- ---------------------------------------------------------------------------
-- Deleting orders from the admin panel, as the admin.
-- An order with a farmer payout still fails (farmer_payouts is on delete
-- restrict, 23503), and then nothing is deleted.
-- ---------------------------------------------------------------------------

create or replace function public.admin_delete_orders(p_order_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'NOT_ALLOWED';
  end if;

  delete from public.orders where id = any(p_order_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.admin_delete_orders(uuid[]) from public, anon;
grant execute on function public.admin_delete_orders(uuid[]) to authenticated;

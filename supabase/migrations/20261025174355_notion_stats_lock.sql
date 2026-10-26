insert into public.notion_sync_state(key, value) values ('stats_lock', null), ('stats_hash', null)
  on conflict (key) do nothing;

create or replace function public.notion_stats_lock(p_take boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if p_take then
    update notion_sync_state set value = now()::text, updated_at = now()
     where key = 'stats_lock' and (value is null or value::timestamptz < now() - interval '2 minutes')
    returning true into ok;
    return coalesce(ok, false);
  end if;
  update notion_sync_state set value = null, updated_at = now() where key = 'stats_lock';
  return true;
end $$;
revoke all on function public.notion_stats_lock(boolean) from public, anon, authenticated;

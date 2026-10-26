create or replace function public.finish_notion_sync(p_queue_id bigint, p_error text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_error is null then
    update notion_sync_queue set processed_at = now(), last_error = null where id = p_queue_id;
  else
    update notion_sync_queue set last_error = left(p_error, 1000) where id = p_queue_id;
  end if;
end $$;
revoke all on function public.finish_notion_sync(bigint, text) from public, anon, authenticated;
update public.notion_sync_queue set attempts = 0, claimed_at = null where processed_at is null;

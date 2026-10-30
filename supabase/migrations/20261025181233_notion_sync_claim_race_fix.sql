create or replace function public.claim_notion_sync(p_limit int default 10)
returns table(queue_id bigint, order_id uuid)
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('claim_notion_sync'));
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
    from picked
   where q.id = picked.id and q.claimed_at is null
  returning q.id, q.order_id;
end $$;
revoke all on function public.claim_notion_sync(int) from public, anon, authenticated;

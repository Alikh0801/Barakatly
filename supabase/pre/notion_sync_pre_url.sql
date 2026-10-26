-- PRE only — run after the migrations, never on production.
-- ping_notion_sync() in the migrations calls the production project's
-- notion-sync function. Point it at the pre project's own one instead:
-- replace <PRE_PROJECT_REF> (Supabase → Project Settings → General) first.
create or replace function public.ping_notion_sync()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://<PRE_PROJECT_REF>.supabase.co/functions/v1/notion-sync',
    body := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
end $$;
revoke all on function public.ping_notion_sync() from public, anon, authenticated;

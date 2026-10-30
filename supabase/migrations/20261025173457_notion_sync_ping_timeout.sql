create or replace function public.ping_notion_sync()
returns void language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://stvlelyrtqtwmejvbydc.supabase.co/functions/v1/notion-sync',
    body := '{}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
end $$;
revoke all on function public.ping_notion_sync() from public, anon, authenticated;

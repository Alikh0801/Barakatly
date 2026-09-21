-- ---------------------------------------------------------------------------
-- Supabase's linter flags security-definer views as critical ("Security
-- Definer View"), even when the exposed data is intentionally narrow and
-- safe. Replace the view from 020 with an equivalent security-definer
-- function (pinned search_path) — Supabase's own recommended pattern for
-- exposing one safe column from an otherwise-protected table, which does
-- not trip that advisory.
-- ---------------------------------------------------------------------------
drop view if exists public.public_farmer_names;

create or replace function public.list_approved_farmer_owner_names()
returns table (farmer_id uuid, owner_name text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select f.id as farmer_id, p.full_name as owner_name
  from public.farmers f
  join public.profiles p on p.id = f.profile_id
  where f.status = 'approved';
$$;

grant execute on function public.list_approved_farmer_owner_names() to anon, authenticated;

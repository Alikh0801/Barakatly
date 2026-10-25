-- ---------------------------------------------------------------------------
-- Farms are shown by the farmer's own name; farm names are going away
-- (050 drops the columns). Profiles are private, so the name is read
-- through this function: PostgREST treats it as a column of farmers, e.g.
--   farmers ( id, name:owner_name )
-- It returns only the name, and only for farmers anyone may see anyway.
--
-- Run this before deploying the code that reads it; farm_name stops being
-- required here so the new sign-up, which no longer asks for it, works
-- before 050 removes the column.
-- ---------------------------------------------------------------------------

-- Looks the farmer up by id rather than trusting the row it is handed, so a
-- direct call can't read an arbitrary profile: only approved farmers, the
-- farmer themselves and admins get a name.
create or replace function public.owner_name(public.farmers)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.full_name
  from public.farmers f
  join public.profiles p on p.id = f.profile_id
  where f.id = $1.id
    and (f.status = 'approved' or f.profile_id = auth.uid() or public.is_admin());
$$;

grant execute on function public.owner_name(public.farmers) to anon, authenticated;

alter table public.farmers alter column farm_name drop not null;

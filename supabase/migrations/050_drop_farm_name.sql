-- ---------------------------------------------------------------------------
-- Farm names are gone from the site; farmers are shown by their own name
-- (owner_name(), migration 049). Run this after the code that no longer
-- reads farm_name is deployed.
-- ---------------------------------------------------------------------------

-- Where migration 048 is in place its farmers guard compares farm_name, and
-- would fail on every farmer update once the column is gone. Replace it
-- first; where 048 hasn't run yet there is nothing to replace.
do $do$
begin
  if to_regprocedure('public.guard_farmers_write()') is not null then
    execute $fn$
      create or replace function public.guard_farmers_write()
      returns trigger
      language plpgsql
      set search_path = public, pg_temp
      as $body$
      begin
        if public.is_privileged_writer() then
          return new;
        end if;

        if tg_op = 'INSERT' then
          new.status := 'pending';
          new.verified_at := null;
          return new;
        end if;

        if new.status is distinct from old.status
           or new.verified_at is distinct from old.verified_at
           or new.profile_id is distinct from old.profile_id
           or new.description is distinct from old.description
           or new.location_text is distinct from old.location_text
           or new.location_lat is distinct from old.location_lat
           or new.location_lng is distinct from old.location_lng
           or new.location_map_url is distinct from old.location_map_url
           or new.avatar_url is distinct from old.avatar_url
           or new.cover_url is distinct from old.cover_url then
          raise exception 'NOT_ALLOWED: farmer fields need admin approval';
        end if;
        return new;
      end;
      $body$;
    $fn$;
  end if;
end;
$do$;

alter table public.farmers drop column if exists farm_name;
alter table public.farmers drop column if exists pending_farm_name;

-- Replaced by owner_name().
drop function if exists public.list_approved_farmer_owner_names();

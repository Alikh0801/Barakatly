-- ---------------------------------------------------------------------------
-- Anyone could make themselves admin straight through the Supabase API (the
-- anon key and URL are public, as they must be):
--   * at sign-up: handle_new_user() took the role from the metadata the
--     client sends, so POST /auth/v1/signup with "data": {"role": "admin"}
--     created an admin profile, before the email was even confirmed;
--   * afterwards: "Profiles are updatable by owner" limits rows, not columns,
--     so PATCH /rest/v1/profiles?id=eq.<own id> {"role": "admin"} went through.
-- is_admin() then let them into the admin panel and every admin policy.
--
-- Now the role is always "customer" at sign-up, users may update only their
-- own name, phone and avatar, and a trigger refuses any role change that
-- doesn't come from the server (service role, as approveFarmer,
-- deleteFarmer and createCourier use) or an admin.
--
-- The function and trigger names and bodies match migration 048 (already
-- run on the test site), so the two never fight whichever runs first.
-- ---------------------------------------------------------------------------

-- True for admins and for anything not running as a signed-in API user:
-- the service role, the SQL editor, and security definer functions (which
-- run as their owner). Deliberately not security definer itself, so
-- current_user is the caller's.
create or replace function public.is_privileged_writer()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select current_user not in ('anon', 'authenticated') or public.is_admin();
$$;

-- 1. Sign-up never takes the role from what the client sends. The app signs
--    everyone up as a customer; admins promote them later (a farmer's intent
--    travels in the farmer_signup flag, not in the role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    'customer'::public.user_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.phone
  );

  return new;
end;
$$;

-- 2. API users may change only their own name, phone and avatar (the rows
--    are still limited by the RLS policies). Profiles are created by the
--    sign-up trigger and removed with the auth user, never by API users.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

-- 3. Defence in depth: the role (and the id) change only from the server or
--    an admin, whatever the grants become.
create or replace function public.guard_profiles_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if not public.is_privileged_writer()
     and (new.role is distinct from old.role or new.id is distinct from old.id) then
    raise exception 'NOT_ALLOWED: role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
before update on public.profiles
for each row execute function public.guard_profiles_update();

-- Trigger functions are not for the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profiles_update() from public, anon, authenticated;

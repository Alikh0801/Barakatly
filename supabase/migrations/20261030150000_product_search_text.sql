-- ---------------------------------------------------------------------------
-- products.search_text: title and farmer name in az_normalize() form
-- (Azerbaijani letters as plain Latin, lower case), so "badimcan" finds
-- "Badımcan". Same rule as src/lib/shop/normalize.ts.
--
-- Production got this by hand; this file brings PRE and fresh databases in
-- line with it. Safe to run where it already exists.
-- ---------------------------------------------------------------------------

create or replace function public.az_normalize(t text)
returns text
language sql
immutable parallel safe
set search_path = public
as $$
  select lower(translate(coalesce(t, ''), 'İIıƏəÖöÜüŞşÇçĞğ', 'iiieeoouussccgg'))
$$;

alter table public.products add column if not exists search_text text;

create or replace function public.products_set_search_text()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.search_text := public.az_normalize(
    new.title || ' ' || coalesce((select pf.full_name from farmers f join profiles pf on pf.id = f.profile_id where f.id = new.farmer_id), ''));
  return new;
end $$;

create or replace function public.profiles_refresh_product_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.full_name is distinct from old.full_name then
    update products p
       set search_text = public.az_normalize(p.title || ' ' || coalesce(new.full_name, ''))
     where p.farmer_id in (select id from farmers where profile_id = new.id);
  end if;
  return new;
end $$;

drop trigger if exists products_search_text on public.products;
create trigger products_search_text
  before insert or update of title, farmer_id on public.products
  for each row execute function public.products_set_search_text();

drop trigger if exists profiles_refresh_product_search on public.profiles;
create trigger profiles_refresh_product_search
  after update of full_name on public.profiles
  for each row execute function public.profiles_refresh_product_search();

-- Trigger functions aren't for calling through the API.
revoke execute on function public.products_set_search_text() from public, anon, authenticated;
revoke execute on function public.profiles_refresh_product_search() from public, anon, authenticated;

-- Fill the rows that predate the trigger.
update public.products p
   set search_text = public.az_normalize(
     p.title || ' ' || coalesce((select pf.full_name from public.farmers f join public.profiles pf on pf.id = f.profile_id where f.id = p.farmer_id), ''))
 where p.search_text is null;

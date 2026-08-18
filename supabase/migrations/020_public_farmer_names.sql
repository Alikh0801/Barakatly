-- ---------------------------------------------------------------------------
-- Publicly expose the farmer's personal name (from profiles.full_name) for
-- approved farmers, without exposing the rest of the profiles row (email,
-- phone, etc.) which stays protected by RLS.
-- ---------------------------------------------------------------------------
create view public.public_farmer_names
with (security_invoker = false) as
select
  f.id as farmer_id,
  p.full_name as owner_name
from public.farmers f
join public.profiles p on p.id = f.profile_id
where f.status = 'approved';

grant select on public.public_farmer_names to anon, authenticated;

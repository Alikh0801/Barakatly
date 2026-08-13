-- Each account may keep at most one phone number, and a phone number may
-- belong to at most one account. NULL phones are allowed (many accounts have
-- none yet), so this is a partial unique index rather than a column constraint.
--
-- If this fails to create, duplicate phones already exist. Find them with:
--   select phone, count(*) from public.profiles
--   where phone is not null group by phone having count(*) > 1;
-- Resolve the duplicates, then re-run.

create unique index if not exists profiles_phone_unique
  on public.profiles (phone)
  where phone is not null;

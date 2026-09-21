-- ---------------------------------------------------------------------------
-- Farmer profile edits (farm name, description, location, avatar) now go
-- through admin review instead of publishing immediately. Proposed values
-- are staged in these pending_* columns; the live columns only change once
-- an admin approves (see approveFarmerProfileEdit / rejectFarmerProfileEdit).
-- ---------------------------------------------------------------------------
alter table public.farmers
  add column pending_farm_name text,
  add column pending_description text,
  add column pending_location_text text,
  add column pending_avatar_url text,
  add column pending_submitted_at timestamptz;

alter type public.notification_type add value if not exists 'farmer_profile_update';

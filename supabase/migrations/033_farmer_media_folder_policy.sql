-- Farmers' post photos and videos now upload straight from the browser to
-- Storage (the Server Action only receives their paths), so pin every upload
-- to the uploader's own folder. Avatars already live under <user id>/avatar/
-- and post media under <user id>/posts/, so nothing legitimate is affected.
drop policy if exists "Farmers upload farmer media" on storage.objects;

create policy "Farmers upload farmer media"
on storage.objects for insert
with check (
  bucket_id = 'farmer-media'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

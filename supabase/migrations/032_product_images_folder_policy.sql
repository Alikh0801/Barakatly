-- Farmers' product photos now upload straight from the browser to Storage
-- (the Server Action only receives their paths), so pin those uploads to the
-- uploader's own folder (<user id>/uploads/<file>). Admins keep writing the
-- shared site folders (hero/, auth/, categories/) from server actions.
drop policy if exists "Farmers upload product images" on storage.objects;

create policy "Farmers upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and auth.uid() is not null
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
  )
);

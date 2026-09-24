-- Receipts now upload straight from the browser to Storage (the Server Action
-- only receives the path), so the 5 MB cap no longer has to sit under the
-- request-body limit. Raise it to 7 MB to match RECEIPT_MAX_BYTES.
update storage.buckets
set file_size_limit = 7340032
where id = 'payment-receipts';

-- The browser can now write to this bucket directly, so pin every upload to
-- the uploader's own folder (<user id>/<file>). place_order is only ever
-- handed paths inside that folder, and the server re-checks it.
drop policy if exists "Customers upload payment receipts" on storage.objects;

create policy "Customers upload payment receipts"
on storage.objects for insert
with check (
  bucket_id = 'payment-receipts'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- Link columns hold only the links the site writes.
--
-- The site stores Storage URLs (and a map link) in these columns, but a
-- farmer can PATCH/POST them directly, so `javascript:...` could reach an
-- <a href> on the admin panel or the public profile. The UI now refuses
-- non-http(s) hrefs (lib/url/safe-href.ts); these checks keep such values
-- out of the database as well.
--
-- Files: a public Storage object of a Supabase project. The pattern names
-- no project, so the same file serves PRE and production; a project ref is
-- 20 lower-case letters and digits. Pictures may also be Unsplash images:
-- production has some covers and product photos from there.
-- The map link may point anywhere (Google Maps…) but must be https.
--
-- Existing data was checked on both databases before writing this: every
-- value matches.
-- ---------------------------------------------------------------------------

alter table public.farmer_certificates drop constraint if exists farmer_certificates_file_url_storage;
alter table public.farmer_certificates
  add constraint farmer_certificates_file_url_storage
  check (file_url ~ '^https://[a-z0-9]{20}\.supabase\.co/storage/v1/object/public/');

alter table public.farmers drop constraint if exists farmers_location_map_url_https;
alter table public.farmers
  add constraint farmers_location_map_url_https
  check (location_map_url is null or location_map_url ~ '^https://');

alter table public.farmers drop constraint if exists farmers_image_urls_allowed;
alter table public.farmers
  add constraint farmers_image_urls_allowed
  check (
    (avatar_url is null or avatar_url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)')
    and (cover_url is null or cover_url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)')
    and (pending_avatar_url is null or pending_avatar_url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)')
    and (pending_cover_url is null or pending_cover_url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)')
  );

alter table public.product_images drop constraint if exists product_images_url_allowed;
alter table public.product_images
  add constraint product_images_url_allowed
  check (url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)');

alter table public.product_variants drop constraint if exists product_variants_image_url_allowed;
alter table public.product_variants
  add constraint product_variants_image_url_allowed
  check (image_url is null or image_url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)');

alter table public.farmer_post_media drop constraint if exists farmer_post_media_url_allowed;
alter table public.farmer_post_media
  add constraint farmer_post_media_url_allowed
  check (url ~ '^https://([a-z0-9]{20}\.supabase\.co/storage/v1/object/public/|images\.unsplash\.com/)');

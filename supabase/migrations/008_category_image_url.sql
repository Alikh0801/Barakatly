-- Category banner/thumbnail image as URL (admin-managed)

alter table public.categories
  add column if not exists image_url text;

comment on column public.categories.image_url is
  'Public image URL used for category tiles/banners on the site';

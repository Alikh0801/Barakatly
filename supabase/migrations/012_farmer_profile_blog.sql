-- Farmer profile avatar + blog (photos/videos shared with customers)

alter table public.farmers
  add column if not exists avatar_url text;

create type public.farmer_post_media_type as enum ('image', 'video');

create table if not exists public.farmer_posts (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  caption text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farmer_posts_farmer_id_idx
  on public.farmer_posts (farmer_id, created_at desc);

create table if not exists public.farmer_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.farmer_posts (id) on delete cascade,
  media_type public.farmer_post_media_type not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists farmer_post_media_post_id_idx
  on public.farmer_post_media (post_id, sort_order);

create trigger farmer_posts_set_updated_at
before update on public.farmer_posts
for each row execute function public.set_updated_at();

alter table public.farmer_posts enable row level security;
alter table public.farmer_post_media enable row level security;

-- Anyone can read posts from approved farmers
create policy "Public read farmer posts"
on public.farmer_posts for select
using (
  exists (
    select 1 from public.farmers f
    where f.id = farmer_id and f.status = 'approved'
  )
  or public.is_farmer_owner(farmer_id)
  or public.is_admin()
);

create policy "Farmers insert own posts"
on public.farmer_posts for insert
with check (public.is_farmer_owner(farmer_id) or public.is_admin());

create policy "Farmers update own posts"
on public.farmer_posts for update
using (public.is_farmer_owner(farmer_id) or public.is_admin())
with check (public.is_farmer_owner(farmer_id) or public.is_admin());

create policy "Farmers delete own posts"
on public.farmer_posts for delete
using (public.is_farmer_owner(farmer_id) or public.is_admin());

create policy "Public read farmer post media"
on public.farmer_post_media for select
using (
  exists (
    select 1
    from public.farmer_posts p
    join public.farmers f on f.id = p.farmer_id
    where p.id = post_id
      and (f.status = 'approved' or public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
);

create policy "Farmers manage own post media"
on public.farmer_post_media for all
using (
  exists (
    select 1 from public.farmer_posts p
    where p.id = post_id
      and (public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.farmer_posts p
    where p.id = post_id
      and (public.is_farmer_owner(p.farmer_id) or public.is_admin())
  )
);

-- Media bucket: images + short videos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'farmer-media',
  'farmer-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read farmer media"
on storage.objects for select
using (bucket_id = 'farmer-media');

create policy "Farmers upload farmer media"
on storage.objects for insert
with check (
  bucket_id = 'farmer-media'
  and auth.uid() is not null
);

create policy "Farmers update own farmer media"
on storage.objects for update
using (bucket_id = 'farmer-media' and auth.uid() = owner)
with check (bucket_id = 'farmer-media' and auth.uid() = owner);

create policy "Farmers delete own farmer media"
on storage.objects for delete
using (bucket_id = 'farmer-media' and auth.uid() = owner);

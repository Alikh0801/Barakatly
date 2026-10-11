-- ---------------------------------------------------------------------------
-- Farmer profile redesign: a cover photo, a certificates section and a real
-- farmer rating.
-- ---------------------------------------------------------------------------

-- Cover photo. Like the avatar, a new cover is staged in pending_cover_url
-- and only goes live once an admin approves the profile edit.
alter table public.farmers
  add column if not exists cover_url text,
  add column if not exists pending_cover_url text;

-- Certificates (organic, quality, etc.) a farmer shows on their profile.
-- The file is a photo or a PDF in the farmer-media bucket, under
-- <user id>/certificates/.
create table if not exists public.farmer_certificates (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  file_url text not null,
  file_type text not null check (file_type in ('image', 'pdf')),
  created_at timestamptz not null default now()
);

create index if not exists farmer_certificates_farmer_id_idx
  on public.farmer_certificates (farmer_id, created_at desc);

alter table public.farmer_certificates enable row level security;

-- Public for approved farmers, like the rest of their profile.
drop policy if exists "Certificates are public for approved farmers" on public.farmer_certificates;
create policy "Certificates are public for approved farmers"
on public.farmer_certificates for select
using (
  exists (
    select 1 from public.farmers f
    where f.id = farmer_certificates.farmer_id
      and (
        f.status = 'approved'::public.farmer_status
        or f.profile_id = auth.uid()
      )
  )
  or public.is_admin()
);

drop policy if exists "Approved farmers add own certificates" on public.farmer_certificates;
create policy "Approved farmers add own certificates"
on public.farmer_certificates for insert
with check (
  exists (
    select 1 from public.farmers f
    where f.id = farmer_certificates.farmer_id
      and f.profile_id = auth.uid()
      and f.status = 'approved'::public.farmer_status
  )
);

drop policy if exists "Farmers or admins delete certificates" on public.farmer_certificates;
create policy "Farmers or admins delete certificates"
on public.farmer_certificates for delete
using (
  exists (
    select 1 from public.farmers f
    where f.id = farmer_certificates.farmer_id
      and f.profile_id = auth.uid()
  )
  or public.is_admin()
);

-- Certificates are often PDFs; the bucket only took images and video.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/pdf')
where id = 'farmer-media'
  and not ('application/pdf' = any (allowed_mime_types));

-- ---------------------------------------------------------------------------
-- The farmer's rating: the average of every review on their products.
-- Security definer so reviews on products a visitor can no longer see
-- (archived, sold out) still count.
-- ---------------------------------------------------------------------------
create or replace function public.farmer_rating_summary(p_farmer_id uuid)
returns table (average numeric, total integer)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select round(avg(r.rating)::numeric, 1), count(*)::integer
  from public.product_reviews r
  join public.products p on p.id = r.product_id
  where p.farmer_id = p_farmer_id;
$$;

grant execute on function public.farmer_rating_summary(uuid) to anon, authenticated;

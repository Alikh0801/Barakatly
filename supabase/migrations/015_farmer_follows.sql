-- Lets customers follow farmers; powers the follower count on farmer profiles

create table public.farmer_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  farmer_id uuid not null references public.farmers (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, farmer_id)
);

create index farmer_follows_farmer_id_idx on public.farmer_follows (farmer_id);
create index farmer_follows_follower_id_idx on public.farmer_follows (follower_id);

alter table public.farmer_follows enable row level security;

create policy "Follow counts are publicly readable"
on public.farmer_follows for select
using (true);

create policy "Customers follow farmers"
on public.farmer_follows for insert
with check (follower_id = auth.uid());

create policy "Customers unfollow farmers"
on public.farmer_follows for delete
using (follower_id = auth.uid());

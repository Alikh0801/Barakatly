-- ---------------------------------------------------------------------------
-- A farmer could follow their own farm. Forbid it in the insert policy and
-- remove the self-follows that already exist (they inflated follower counts).
-- ---------------------------------------------------------------------------

delete from public.farmer_follows ff
using public.farmers f
where f.id = ff.farmer_id
  and f.profile_id = ff.follower_id;

drop policy if exists "Customers follow farmers" on public.farmer_follows;
create policy "Customers follow farmers"
on public.farmer_follows for insert
with check (
  follower_id = auth.uid()
  and not exists (
    select 1 from public.farmers f
    where f.id = farmer_follows.farmer_id
      and f.profile_id = auth.uid()
  )
);

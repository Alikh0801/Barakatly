-- ---------------------------------------------------------------------------
-- Customer reviews of Barakatly itself, for the home page.
--
-- Only a customer with at least one delivered order may write one, one per
-- customer (writing again edits it). Nothing reaches the home page until an
-- admin approves it, and an edited review goes back to waiting.
-- The public name is "First L." taken from the profile, never typed in.
-- ---------------------------------------------------------------------------

create table if not exists public.site_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null unique references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 10 and 500),
  city text not null check (char_length(city) between 1 and 60),
  display_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_reviews_status_idx
  on public.site_reviews (status, updated_at desc);

-- "Nərgiz Həsənova" -> "Nərgiz H."; a single name stays as it is.
create or replace function public.short_display_name(p_full_name text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(btrim(p_full_name), '') = '' then 'Müştəri'
    when array_length(regexp_split_to_array(btrim(p_full_name), '\s+'), 1) = 1
      then btrim(p_full_name)
    else split_part(btrim(p_full_name), ' ', 1) || ' ' ||
      upper(left((regexp_split_to_array(btrim(p_full_name), '\s+'))[
        array_length(regexp_split_to_array(btrim(p_full_name), '\s+'), 1)
      ], 1)) || '.'
  end;
$$;

-- Fills in the public name and keeps customers from approving themselves:
-- any change by a non-admin puts the review back to "pending".
create or replace function public.site_reviews_before_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin() then
    if tg_op = 'UPDATE'
       and (new.rating, new.comment, new.city) is distinct from (old.rating, old.comment, old.city) then
      new.updated_at := now();
    end if;
    return new;
  end if;

  select public.short_display_name(p.full_name)
    into new.display_name
    from public.profiles p
   where p.id = new.customer_id;

  new.status := 'pending';
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists site_reviews_before_write on public.site_reviews;
create trigger site_reviews_before_write
before insert or update on public.site_reviews
for each row execute function public.site_reviews_before_write();

alter table public.site_reviews enable row level security;

drop policy if exists "Approved site reviews are public" on public.site_reviews;
create policy "Approved site reviews are public"
on public.site_reviews for select
using (status = 'approved' or customer_id = auth.uid() or public.is_admin());

drop policy if exists "Customers with a delivered order write a site review" on public.site_reviews;
create policy "Customers with a delivered order write a site review"
on public.site_reviews for insert
with check (
  customer_id = auth.uid()
  and exists (
    select 1 from public.orders o
    where o.customer_id = auth.uid()
      and o.status = 'delivered'::public.order_status
  )
);

drop policy if exists "Customers edit own site review, admins moderate" on public.site_reviews;
create policy "Customers edit own site review, admins moderate"
on public.site_reviews for update
using (customer_id = auth.uid() or public.is_admin())
with check (customer_id = auth.uid() or public.is_admin());

drop policy if exists "Customers or admins delete site reviews" on public.site_reviews;
create policy "Customers or admins delete site reviews"
on public.site_reviews for delete
using (customer_id = auth.uid() or public.is_admin());

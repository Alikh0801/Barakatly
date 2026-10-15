-- ---------------------------------------------------------------------------
-- 1. Rating on every product card.
--
-- Product lists would otherwise need every review row to show stars, so each
-- product carries its own average and count, kept up to date by a trigger
-- on product_reviews.
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists rating_average numeric(2, 1),
  add column if not exists rating_count integer not null default 0;

create or replace function public.refresh_product_rating(p_product_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.products p
  set rating_average = s.average,
      rating_count = s.total
  from (
    select round(avg(r.rating)::numeric, 1) as average, count(*)::integer as total
    from public.product_reviews r
    where r.product_id = p_product_id
  ) s
  where p.id = p_product_id;
$$;

revoke execute on function public.refresh_product_rating(uuid) from public, anon, authenticated;

create or replace function public.product_reviews_refresh_rating()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_product_rating(old.product_id);
  else
    perform public.refresh_product_rating(new.product_id);
    if tg_op = 'UPDATE' then
      if old.product_id <> new.product_id then
        perform public.refresh_product_rating(old.product_id);
      end if;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists product_reviews_refresh_rating on public.product_reviews;
create trigger product_reviews_refresh_rating
after insert or update or delete on public.product_reviews
for each row execute function public.product_reviews_refresh_rating();

-- Fill in the reviews written before this migration.
update public.products p
set rating_average = s.average,
    rating_count = s.total
from (
  select product_id, round(avg(rating)::numeric, 1) as average, count(*)::integer as total
  from public.product_reviews
  group by product_id
) s
where p.id = s.product_id;

-- ---------------------------------------------------------------------------
-- 2. Favourites ("Sevimlilər"): products a customer hearted.
-- ---------------------------------------------------------------------------
create table if not exists public.wishlist_items (
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

create index if not exists wishlist_items_customer_created_idx
  on public.wishlist_items (customer_id, created_at desc);

alter table public.wishlist_items enable row level security;

drop policy if exists "Customers read own wishlist" on public.wishlist_items;
create policy "Customers read own wishlist"
on public.wishlist_items for select
using (customer_id = auth.uid());

drop policy if exists "Customers add to own wishlist" on public.wishlist_items;
create policy "Customers add to own wishlist"
on public.wishlist_items for insert
with check (customer_id = auth.uid());

drop policy if exists "Customers remove from own wishlist" on public.wishlist_items;
create policy "Customers remove from own wishlist"
on public.wishlist_items for delete
using (customer_id = auth.uid());

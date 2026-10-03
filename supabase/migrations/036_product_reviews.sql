-- ---------------------------------------------------------------------------
-- Real customer reviews, replacing the hard-coded ones on the product page.
--
-- A review may only be written by someone who actually received the product:
-- the insert policy requires a delivered order_item for that product and that
-- customer. That rule lives in RLS, not just in the UI, so it also holds for
-- anything talking to the API directly.
-- ---------------------------------------------------------------------------

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per customer per product; writing again updates it.
  unique (product_id, customer_id)
);

create index if not exists product_reviews_product_id_idx
  on public.product_reviews (product_id);

drop trigger if exists product_reviews_set_updated_at on public.product_reviews;
create trigger product_reviews_set_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at();

alter table public.product_reviews enable row level security;

-- Reviews are public: they are shown to everyone on the product page.
drop policy if exists "Reviews are public" on public.product_reviews;
create policy "Reviews are public"
on public.product_reviews for select
using (true);

-- Only a customer who actually received this product may review it.
drop policy if exists "Buyers write own reviews" on public.product_reviews;
create policy "Buyers write own reviews"
on public.product_reviews for insert
with check (
  customer_id = auth.uid()
  and exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = product_reviews.product_id
      and o.customer_id = auth.uid()
      and oi.status = 'delivered'::public.order_item_status
  )
);

drop policy if exists "Customers update own reviews" on public.product_reviews;
create policy "Customers update own reviews"
on public.product_reviews for update
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

-- A customer can remove their own review; an admin can moderate any of them.
drop policy if exists "Customers or admins delete reviews" on public.product_reviews;
create policy "Customers or admins delete reviews"
on public.product_reviews for delete
using (customer_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- The reviewer's name lives in profiles, which RLS only exposes to its owner
-- and admins — so a plain join would return nothing for other visitors. Same
-- approach as list_approved_farmer_owner_names (migration 021): a narrow
-- security-definer function that exposes just the name alongside the review.
-- ---------------------------------------------------------------------------
create or replace function public.list_product_reviews(p_product_id uuid)
returns table (
  id uuid,
  customer_id uuid,
  customer_name text,
  rating smallint,
  comment text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select r.id, r.customer_id, p.full_name as customer_name,
         r.rating, r.comment, r.created_at
  from public.product_reviews r
  join public.profiles p on p.id = r.customer_id
  where r.product_id = p_product_id
  order by r.created_at desc
  limit 50;
$$;

grant execute on function public.list_product_reviews(uuid) to anon, authenticated;

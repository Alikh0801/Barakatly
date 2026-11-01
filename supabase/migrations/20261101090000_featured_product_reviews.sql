-- ---------------------------------------------------------------------------
-- The home page shows product reviews an admin picks.
--
-- Customers stop writing a separate review of Barakatly for the home page:
-- at the end of an order they review the products they received
-- (product_reviews, already limited to delivered lines), and the admin
-- picks some of those for the home page. site_reviews is left as it is.
--
-- featured_at: when an admin put the review on the home page; null when it
-- isn't there. Only an admin sets it, and a customer editing the text or
-- the stars takes the review off the home page until an admin picks it
-- again.
-- ---------------------------------------------------------------------------

alter table public.product_reviews add column if not exists featured_at timestamptz;

create index if not exists product_reviews_featured_idx
  on public.product_reviews (featured_at desc)
  where featured_at is not null;

create or replace function public.guard_product_reviews_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_privileged_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.featured_at := null;
    return new;
  end if;

  if new.featured_at is distinct from old.featured_at then
    raise exception 'NOT_ALLOWED: featured';
  end if;
  if (new.rating, new.comment) is distinct from (old.rating, old.comment) then
    new.featured_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists product_reviews_guard_write on public.product_reviews;
create trigger product_reviews_guard_write
before insert or update on public.product_reviews
for each row execute function public.guard_product_reviews_write();

revoke execute on function public.guard_product_reviews_write() from public, anon, authenticated;

-- Admins pick reviews for the home page (customers keep editing their own).
drop policy if exists "Admins feature reviews" on public.product_reviews;
create policy "Admins feature reviews"
on public.product_reviews for update
using (public.is_admin())
with check (public.is_admin());

-- The home page: picked reviews with a comment, newest pick first. The
-- reviewer's name sits in profiles, which RLS hides from visitors, so this
-- returns only "First L." beside the review, like list_product_reviews.
create or replace function public.list_featured_product_reviews(p_limit integer default 3)
returns table (
  id uuid,
  rating smallint,
  comment text,
  display_name text,
  product_id uuid,
  product_title text
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select r.id, r.rating, r.comment, public.short_display_name(p.full_name),
         r.product_id, pr.title
  from public.product_reviews r
  join public.profiles p on p.id = r.customer_id
  join public.products pr on pr.id = r.product_id
  where r.featured_at is not null
    and nullif(btrim(coalesce(r.comment, '')), '') is not null
    and pr.status = 'approved'
  order by r.featured_at desc
  limit least(greatest(coalesce(p_limit, 3), 1), 12);
$$;

grant execute on function public.list_featured_product_reviews(integer) to anon, authenticated;

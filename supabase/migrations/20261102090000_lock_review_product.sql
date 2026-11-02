-- ---------------------------------------------------------------------------
-- A review stays on the product it was written for.
--
-- "Customers update own reviews" (036) only checks customer_id; whether the
-- customer bought and received the product is checked on insert only. So a
-- customer could write one honest review of something they received and
-- then PATCH it onto any other product ({"product_id": "..."}), whose
-- rating the refresh trigger would then recompute. The comment had no
-- length limit either.
--
-- guard_product_reviews_write() (20261101090000) now also refuses a change
-- of product_id, customer_id or created_at by anyone but an admin, and the
-- comment is at most 1000 characters, as in the review form.
-- ---------------------------------------------------------------------------

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

  -- An upsert rewrites these with the same values, which is fine.
  if new.product_id is distinct from old.product_id
     or new.customer_id is distinct from old.customer_id
     or new.created_at is distinct from old.created_at then
    raise exception 'NOT_ALLOWED: review product';
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

revoke execute on function public.guard_product_reviews_write() from public, anon, authenticated;

alter table public.product_reviews drop constraint if exists product_reviews_comment_length;
alter table public.product_reviews
  add constraint product_reviews_comment_length
  check (comment is null or char_length(comment) <= 1000);

-- ---------------------------------------------------------------------------
-- Package sizes: a jar of 0,5 kq or 1 kq, a glass of 10 qr or 25 qr, a whole
-- bird of 1–1,3 kq. The unit says how it is sold, the size how big one is.
-- The app offers a fixed list per unit (UNIT_SIZES in src/lib/shop/format.ts).
--
-- Order lines keep the size they were bought in, copied from the product when
-- the line is created, so a later edit of the product doesn't rewrite
-- history. A trigger does it, so place_order() needs no change.
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists unit_size text
    check (unit_size is null or char_length(unit_size) between 1 and 30);

alter table public.order_items
  add column if not exists unit_size text
    check (unit_size is null or char_length(unit_size) between 1 and 30);

create or replace function public.order_items_copy_unit_size()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.unit_size is null then
    select p.unit_size into new.unit_size
      from public.products p
      where p.id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists order_items_copy_unit_size on public.order_items;
create trigger order_items_copy_unit_size
before insert on public.order_items
for each row execute function public.order_items_copy_unit_size();

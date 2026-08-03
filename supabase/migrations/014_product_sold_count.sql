-- Track total sold quantity per product for popularity sorting in the shop

alter table public.products
add column sold_count numeric(10, 2) not null default 0;

update public.products p
set sold_count = coalesce(t.total, 0)
from (
  select product_id, sum(quantity) as total
  from public.order_items
  group by product_id
) t
where t.product_id = p.id;

create or replace function public.increment_product_sold_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set sold_count = sold_count + new.quantity
  where id = new.product_id;
  return new;
end;
$$;

create trigger order_items_increment_sold_count
after insert on public.order_items
for each row execute function public.increment_product_sold_count();

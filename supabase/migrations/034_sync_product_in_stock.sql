-- ---------------------------------------------------------------------------
-- in_stock is derived from quantity_available, but nothing enforced that: it
-- was kept in sync by hand in place_order(), the cancel-restore trigger and
-- the farmer product actions. Any path that forgot (or a manual SQL edit)
-- could leave in_stock = true with quantity_available = 0, which makes a
-- sold-out product look available in the shop listings.
--
-- A trigger makes the two impossible to disagree, whoever writes the row.
-- ---------------------------------------------------------------------------

create or replace function public.sync_product_in_stock()
returns trigger
language plpgsql
as $$
begin
  new.in_stock := new.quantity_available > 0;
  return new;
end;
$$;

drop trigger if exists products_sync_in_stock on public.products;

create trigger products_sync_in_stock
before insert or update of quantity_available, in_stock on public.products
for each row execute function public.sync_product_in_stock();

-- Fix any row that already drifted.
update public.products
set in_stock = quantity_available > 0
where in_stock is distinct from (quantity_available > 0);

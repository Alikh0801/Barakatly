-- ---------------------------------------------------------------------------
-- order_items.farmer_id was ON DELETE CASCADE, so hard-deleting a farmer
-- (deleteFarmer) silently destroyed the line items of every order they
-- were ever part of — including already-delivered, paid orders, not just
-- pending ones. Order totals stayed on the parent `orders` row with no
-- items left to explain them.
--
-- deleteFarmer already has a friendly error message anticipating exactly
-- this ("Sifariş tarixçəsi ... mane ola bilər") — it was dead code because
-- CASCADE meant the delete always succeeded. Switching this FK to RESTRICT
-- makes that guard real: deleting a farmer with any order history now fails
-- cleanly, and the admin is pointed at Deactivate/Suspend instead, which
-- already leaves products/orders untouched.
-- ---------------------------------------------------------------------------
alter table public.order_items
  drop constraint order_items_farmer_id_fkey,
  add constraint order_items_farmer_id_fkey
    foreign key (farmer_id) references public.farmers (id) on delete restrict;

-- ---------------------------------------------------------------------------
-- Lets a farmer take a product off sale without deleting it.
--
-- Deleting was never an option: order_items.product_id is ON DELETE CASCADE,
-- so removing a product would also wipe it out of every past order, breaking
-- the customer's and the farmer's order history (the same reason farmer
-- deletion was already protected in migration 027).
--
-- An "archived" status keeps the row — and therefore the order history —
-- while every public query already filters on status = 'approved', so the
-- product disappears from the shop, search, farmer profile, cart and
-- place_order() without any further change.
-- ---------------------------------------------------------------------------

alter type public.product_status add value if not exists 'archived';

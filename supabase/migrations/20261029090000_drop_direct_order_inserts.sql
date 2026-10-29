-- ---------------------------------------------------------------------------
-- Orders, their lines and payments are created only by place_order() (a
-- security definer function, migration 023 onwards), but the insert policies
-- from migration 002 were never dropped. With the public anon key and their
-- own login a customer could POST straight to the API:
--   * /rest/v1/orders      with any status and amounts;
--   * /rest/v1/order_items with any farmer, product, price and status
--     ("delivered"), and no stock taken;
--   * /rest/v1/payments    already "confirmed", which fires the farmer
--     payouts (payments_farmer_payouts), pushes the order to Notion as paid
--     and puts it in the farmers' panels.
-- Delivered lines then also opened product and site reviews and inflated
-- sold_count.
--
-- The site never inserts these rows itself (checkout calls place_order), so
-- the policies go, and API users lose the insert privilege on the three
-- tables altogether. place_order() runs as its owner and is unaffected;
-- admins keep updating and deleting through their existing policies.
-- ---------------------------------------------------------------------------

drop policy if exists "Customers create own orders" on public.orders;
drop policy if exists "Customers insert order items via order" on public.order_items;
drop policy if exists "Customers create own payments" on public.payments;

revoke insert on public.orders, public.order_items, public.payments from anon, authenticated;

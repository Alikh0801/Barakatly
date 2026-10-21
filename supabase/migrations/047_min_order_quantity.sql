-- ---------------------------------------------------------------------------
-- The smallest amount a customer may order of a product, set by the farmer:
-- 0,5 kq of cheese, 1 kq of honey. Null means the site's own floor for the
-- unit (50 qr, 0,5 l or one piece), which the app applies; amounts move in
-- the same steps (src/lib/shop/quantity.ts).
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists min_order_quantity numeric(10, 2)
    check (min_order_quantity is null or min_order_quantity > 0);

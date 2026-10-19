-- ---------------------------------------------------------------------------
-- A farmer can cancel their line of a paid order before handing it over,
-- and must say why. The reason is kept on the line, so the customer and the
-- admin (who settles the refund) see it next to the product. Lines cancelled
-- with the whole order keep a null reason.
-- ---------------------------------------------------------------------------

alter table public.order_items
  add column if not exists cancel_reason text
    check (cancel_reason is null or char_length(cancel_reason) between 1 and 500);

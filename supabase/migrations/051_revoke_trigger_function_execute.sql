-- ---------------------------------------------------------------------------
-- These SECURITY DEFINER functions only run as triggers, but like every
-- function they were executable by PUBLIC, so anon and signed-in users could
-- reach them at /rest/v1/rpc/... (Supabase advisor). Triggers don't need
-- EXECUTE on their function, so taking it away changes nothing for them.
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.increment_product_sold_count() from public, anon, authenticated;
revoke execute on function public.cascade_cancel_order_items() from public, anon, authenticated;
revoke execute on function public.order_items_copy_unit_size() from public, anon, authenticated;
revoke execute on function public.product_reviews_refresh_rating() from public, anon, authenticated;
revoke execute on function public.site_reviews_before_write() from public, anon, authenticated;

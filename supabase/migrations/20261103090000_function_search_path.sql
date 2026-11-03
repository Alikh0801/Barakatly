-- ---------------------------------------------------------------------------
-- A fixed search_path for the last functions without one (Supabase advisor:
-- function_search_path_mutable). None of them reads a table, so nothing
-- changes in what they do; the setting only stops a caller's search_path
-- from deciding which objects they resolve.
-- ---------------------------------------------------------------------------

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.short_display_name(text) set search_path = public, pg_temp;
alter function public.sync_product_in_stock() set search_path = public, pg_temp;

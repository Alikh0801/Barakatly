-- ---------------------------------------------------------------------------
-- More selling units: banka (jar), stəkan (glass) and dəstə (bunch). Jarred
-- pickles and jams, berries by the glass and herbs by the bunch were listed
-- as "ədəd" until now.
--
-- Numbered after 043/044, which are still on the pre branch.
-- ---------------------------------------------------------------------------

alter type public.unit_type add value if not exists 'jar';
alter type public.unit_type add value if not exists 'glass';
alter type public.unit_type add value if not exists 'bunch';

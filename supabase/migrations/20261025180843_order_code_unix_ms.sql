-- Order number = Unix time in milliseconds, e.g. 1792950806823.
create or replace function public.generate_order_code()
returns text language plpgsql set search_path = public as $$
declare
  code bigint;
begin
  perform pg_advisory_xact_lock(hashtext('generate_order_code'));
  code := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;
  while exists (select 1 from orders where order_code = code::text) loop
    code := code + 1;
  end loop;
  return code::text;
end $$;

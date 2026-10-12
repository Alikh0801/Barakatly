-- ---------------------------------------------------------------------------
-- Site statistics for the admin panel: one row per page view.
--
-- Anonymous by design: no user id and no IP address is stored. A visitor is
-- a random id kept in the browser, so unique visitors can be counted without
-- knowing who they are. Rows older than 21 days are deleted.
-- ---------------------------------------------------------------------------

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null check (char_length(path) between 1 and 300),
  referrer_host text,
  country text,
  region text,
  city text,
  device text not null default 'desktop'
    check (device in ('mobile', 'tablet', 'desktop', 'other')),
  browser text,
  os text,
  visitor_id uuid,
  is_authenticated boolean not null default false,
  viewer_role text
);

create index if not exists page_views_created_at_idx
  on public.page_views (created_at);

-- No policies: only the server (service role) writes rows, and admins read
-- them through admin_page_view_stats below.
alter table public.page_views enable row level security;

-- ---------------------------------------------------------------------------
-- 21-day retention.
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_page_views()
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  with deleted as (
    delete from public.page_views
    where created_at < now() - interval '21 days'
    returning 1
  )
  select count(*)::integer from deleted;
$$;

revoke execute on function public.purge_old_page_views() from public, anon, authenticated;
grant execute on function public.purge_old_page_views() to service_role;

-- Daily clean-up with pg_cron where it is available. The stats function and
-- the tracking endpoint also purge, so retention holds even without it.
do $$
begin
  create extension if not exists pg_cron;
exception when others then
  raise notice 'pg_cron is not available: %', sqlerrm;
end
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('purge-page-views', '17 0 * * *', 'select public.purge_old_page_views()');
  end if;
exception when others then
  raise notice 'Could not schedule purge-page-views: %', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- Everything the admin "Statistika" page shows, for the last p_days days
-- (1 = today only), counted in Baku time.
-- ---------------------------------------------------------------------------
create or replace function public.admin_page_view_stats(p_days integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_days integer := least(greatest(coalesce(p_days, 7), 1), 21);
  v_today date := (now() at time zone 'Asia/Baku')::date;
  v_first_day date := v_today - (v_days - 1);
  v_from timestamptz := v_first_day::timestamp at time zone 'Asia/Baku';
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can read site statistics' using errcode = '42501';
  end if;

  perform public.purge_old_page_views();

  with v as (
    select * from public.page_views where created_at >= v_from
  )
  select jsonb_build_object(
    'days', v_days,
    'views', (select count(*) from v),
    'visitors', (select count(distinct visitor_id) from v),
    'signed_in_views', (select count(*) from v where is_authenticated),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'day', d.day::date,
        'views', coalesce(c.views, 0),
        'visitors', coalesce(c.visitors, 0)
      ) order by d.day), '[]'::jsonb)
      from generate_series(v_first_day, v_today, interval '1 day') as d(day)
      left join (
        select (created_at at time zone 'Asia/Baku')::date as day,
               count(*) as views,
               count(distinct visitor_id) as visitors
        from v group by 1
      ) c on c.day = d.day::date
    ),
    'hourly', (
      select jsonb_agg(jsonb_build_object('hour', h, 'views', coalesce(c.views, 0)) order by h)
      from generate_series(0, 23) as h
      left join (
        select extract(hour from created_at at time zone 'Asia/Baku')::integer as hour,
               count(*) as views
        from v group by 1
      ) c on c.hour = h
    ),
    'pages', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select path as label, count(*) as views from v group by 1 order by 2 desc limit 10) t
    ),
    'countries', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select country as label, count(*) as views from v group by 1 order by 2 desc limit 10) t
    ),
    'cities', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'country', country, 'views', views) order by views desc), '[]'::jsonb)
      from (select city as label, country, count(*) as views from v group by 1, 2 order by 3 desc limit 10) t
    ),
    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select device as label, count(*) as views from v group by 1) t
    ),
    'browsers', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select browser as label, count(*) as views from v group by 1 order by 2 desc limit 8) t
    ),
    'os', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select os as label, count(*) as views from v group by 1 order by 2 desc limit 8) t
    ),
    'referrers', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select referrer_host as label, count(*) as views from v group by 1 order by 2 desc limit 10) t
    ),
    'roles', (
      select coalesce(jsonb_agg(jsonb_build_object('label', label, 'views', views) order by views desc), '[]'::jsonb)
      from (select viewer_role as label, count(*) as views from v group by 1) t
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_page_view_stats(integer) from public, anon;
grant execute on function public.admin_page_view_stats(integer) to authenticated;

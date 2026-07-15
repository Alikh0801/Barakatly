-- Editable homepage / marketing copy managed by admins

create table if not exists public.site_content (
  key text primary key,
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "Site content is public"
on public.site_content for select
using (true);

create policy "Admins manage site content"
on public.site_content for all
using (public.is_admin())
with check (public.is_admin());

create trigger site_content_set_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

insert into public.site_content (key, title, body)
values (
  'why_barakatly',
  'Niyə Barakatly?',
  'Fermer məhsullarını hər kəs üçün daha əlçatan edirik'
)
on conflict (key) do nothing;

-- Editable homepage / marketing copy managed by admins

create table if not exists public.site_content (
  key text primary key,
  title text not null,
  body text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content
  add column if not exists items jsonb not null default '[]'::jsonb;

alter table public.site_content enable row level security;

drop policy if exists "Site content is public" on public.site_content;
create policy "Site content is public"
on public.site_content for select
using (true);

drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content"
on public.site_content for all
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

insert into public.site_content (key, title, body, items)
values (
  'why_barakatly',
  'Niyə Barakatly?',
  'Fermer məhsullarını hər kəs üçün daha əlçatan edirik',
  '[
    {
      "title": "Həmişə təzə",
      "description": "Məhsullar 24–48 saat ərzində yığılır və çatdırılır ki, maksimum təravət qorunsun.",
      "icon": "🌿"
    },
    {
      "title": "Keyfiyyət zəmanəti",
      "description": "Hər məhsul yoxlanılır və sertifikatlı fermerlərdən seçilir.",
      "icon": "🛡️"
    },
    {
      "title": "Sürətli çatdırılma",
      "description": "Fermerdən birbaşa qapınıza — eyni gün və ya növbəti gün çatdırılma seçimləri.",
      "icon": "🚚"
    },
    {
      "title": "Yerliyə dəstək",
      "description": "Alışlarınız yerli təsərrüfatları və icmaları birbaşa dəstəkləyir.",
      "icon": "🤝"
    }
  ]'::jsonb
)
on conflict (key) do update
set items = excluded.items
where public.site_content.items = '[]'::jsonb
   or public.site_content.items is null;

insert into public.site_content (key, title, body, items)
values (
  'faq',
  'Tez-tez verilən suallar',
  '',
  '[
    {
      "question": "Məhsullar nə qədər təzə olur?",
      "answer": "Məhsullar adətən yığıldıqdan sonra 24–48 saat ərzində çatdırılır. Bu, maksimum təravət və qida dəyərini qorumağa kömək edir."
    },
    {
      "question": "Bir neçə fermerdən eyni sifarişdə ala bilərəm?",
      "answer": "Bəli. Müxtəlif fermerlərin məhsullarını bir səbətdə toplaya bilərsiniz. Sistem sifarişi avtomatik qruplaşdırır və çatdırılmanı koordinasiya edir."
    },
    {
      "question": "Çatdırılma necə işləyir?",
      "answer": "Kuryer şəbəkəmiz məhsulları fermerlərdən götürür və qapınıza çatdırır. Sifarişinizi real vaxtda izləmək mümkün olacaq."
    },
    {
      "question": "Məhsulların orqanik olması necə təsdiqlənir?",
      "answer": "Orqanik məhsul iddia edən fermerlərin sertifikatlarını yoxlayırıq. Məhsullarda “Orqanik” nişanını görə bilərsiniz."
    }
  ]'::jsonb
)
on conflict (key) do update
set items = excluded.items
where public.site_content.items = '[]'::jsonb
   or public.site_content.items is null;

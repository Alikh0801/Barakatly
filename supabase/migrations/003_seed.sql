-- BARAKATLY seed data

insert into public.categories (slug, name_az, icon, sort_order)
values
  ('vegetables', 'Tərəvəzlər', '🥦', 1),
  ('fruits', 'Meyvələr', '🍓', 2),
  ('dairy', 'Süd məhsulları', '🥛', 3),
  ('eggs', 'Yumurta', '🥚', 4),
  ('honey', 'Bal', '🍯', 5),
  ('herbs', 'Göyərti', '🌿', 6),
  ('grains', 'Taxıl', '🌾', 7),
  ('oils', 'Yağlar', '🫒', 8)
on conflict (slug) do nothing;

-- Example banks (replace PAN values in production)
insert into public.banks (name, pan_number, is_active)
select * from (
  values
    ('Kapital Bank', '0000-0000-0000-0000', true),
    ('ABB', '0000-0000-0000-0000', true),
    ('Pasha Bank', '0000-0000-0000-0000', true)
) as v(name, pan_number, is_active)
where not exists (
  select 1 from public.banks b where b.name = v.name
);

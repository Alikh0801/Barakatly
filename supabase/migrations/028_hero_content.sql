-- Seed editable Hero (homepage) content for the admin Hero panel

insert into public.site_content (key, title, body, items)
values (
  'hero',
  'Fermerdən,',
  'Mövsümi məhsulları birbaşa yerli fermerlərdən kəşf edin. Daha sağlam qidalanaraq icmanızı dəstəkləyin.',
  '{
    "highlight": "birbaşa süfrənizə.",
    "chip1": "100% təzə məhsul",
    "chip2": "Təsdiqlənmiş fermerlər",
    "primaryCtaLabel": "Mağazaya bax",
    "secondaryCtaLabel": "Fermer ol",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2400&q=80"
  }'::jsonb
)
on conflict (key) do nothing;

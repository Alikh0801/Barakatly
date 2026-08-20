-- Seed editable Hero (homepage) content for the admin Hero panel

insert into public.site_content (key, title, body, items)
values (
  'hero',
  'Fermerdən,',
  'Mövsümi məhsulları birbaşa yerli fermerlərdən kəşf edin. Daha sağlam qidalanaraq icmanızı dəstəkləyin.',
  '{
    "highlight": "birbaşa süfrənizə.",
    "imageUrl": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2400&q=80"
  }'::jsonb
)
on conflict (key) do nothing;

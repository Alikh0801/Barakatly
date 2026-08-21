-- Seed editable sign-in/sign-up page image + text for the admin Hero panel

insert into public.site_content (key, title, body, items)
values (
  'auth_image',
  'Fermerdən,',
  'Yerli fermerlərdən təzə məhsulları kəşf edin, sifariş verin və icmanızı dəstəkləyin.',
  '{
    "highlight": "birbaşa süfrənizə.",
    "imageUrl": "/hero/kend.jpg"
  }'::jsonb
)
on conflict (key) do nothing;

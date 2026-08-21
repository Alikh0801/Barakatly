-- Seed editable sign-in/sign-up page image for the admin Hero panel

insert into public.site_content (key, title, body, items)
values (
  'auth_image',
  'Giriş şəkli',
  '',
  '{
    "imageUrl": "/hero/kend.jpg"
  }'::jsonb
)
on conflict (key) do nothing;

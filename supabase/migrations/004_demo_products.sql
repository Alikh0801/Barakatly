-- BARAKATLY demo farmers + products
-- Run after 001_initial_schema.sql, 002_rls_policies.sql, 003_seed.sql
-- Safe to re-run: uses fixed UUIDs and ON CONFLICT DO NOTHING

-- ---------------------------------------------------------------------------
-- Demo farmer auth users (not for real login)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111101',
    'authenticated',
    'authenticated',
    'green-valley@demo.barakatly.az',
    crypt('demo-not-for-login', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"farmer","full_name":"Green Valley Farm"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111102',
    'authenticated',
    'authenticated',
    'mountain-herbs@demo.barakatly.az',
    crypt('demo-not-for-login', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"farmer","full_name":"Mountain Herbs Garden"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111103',
    'authenticated',
    'authenticated',
    'sunrise-orchard@demo.barakatly.az',
    crypt('demo-not-for-login', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"farmer","full_name":"Sunrise Orchard"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

-- Ensure farmer role on profiles (trigger may have created them)
update public.profiles
set role = 'farmer'::public.user_role
where id in (
  '11111111-1111-4111-8111-111111111101',
  '11111111-1111-4111-8111-111111111102',
  '11111111-1111-4111-8111-111111111103'
);

-- ---------------------------------------------------------------------------
-- Demo farmers
-- ---------------------------------------------------------------------------
insert into public.farmers (
  id,
  profile_id,
  farm_name,
  description,
  location_text,
  status,
  verified_at
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'Green Valley Farm',
    'Şəki rayonunda təbii üsullarla yetişdirilən tərəvəz və süd məhsulları.',
    'Şəki, Azərbaycan',
    'approved',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111102',
    'Mountain Herbs Garden',
    'Dağlıq bölgədən təzə göyərti, bal və zeytun yağı.',
    'Qəbələ, Azərbaycan',
    'approved',
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111103',
    'Sunrise Orchard',
    'Mövsümi meyvələr və giləmeyvələr.',
    'Quba, Azərbaycan',
    'approved',
    now()
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Demo products (approved, in stock)
-- ---------------------------------------------------------------------------
insert into public.products (
  id,
  farmer_id,
  category_id,
  title,
  description,
  unit_type,
  farmer_price,
  final_price,
  quantity_available,
  in_stock,
  status
)
select
  v.id,
  v.farmer_id,
  c.id,
  v.title,
  v.description,
  v.unit_type::public.unit_type,
  v.farmer_price,
  v.final_price,
  v.quantity_available,
  true,
  'approved'::public.product_status
from (
  values
    (
      '33333333-3333-4333-8333-333333333301'::uuid,
      '22222222-2222-4222-8222-222222222201'::uuid,
      'vegetables',
      'Pomidor',
      'Günəşdə yetişən, ətli və şirəli pomidorlar. Salat və yemək üçün ideal.',
      'kg',
      3.50,
      4.50,
      120
    ),
    (
      '33333333-3333-4333-8333-333333333302'::uuid,
      '22222222-2222-4222-8222-222222222201'::uuid,
      'vegetables',
      'Xiyar',
      'Təzə, xırtıldayan xiyarlar. Yay salatları üçün mükəmməl seçim.',
      'kg',
      2.00,
      2.50,
      80
    ),
    (
      '33333333-3333-4333-8333-333333333303'::uuid,
      '22222222-2222-4222-8222-222222222201'::uuid,
      'dairy',
      'Süzme qatıq',
      'Ev şəraitində hazırlanmış, qatı və ləzzətli süzme qatıq.',
      'liter',
      4.00,
      5.00,
      40
    ),
    (
      '33333333-3333-4333-8333-333333333304'::uuid,
      '22222222-2222-4222-8222-222222222201'::uuid,
      'eggs',
      'Kənd yumurtası',
      'Sərbəst gəzən toyuqlardan təzə yumurta (10 ədəd).',
      'piece',
      3.50,
      4.50,
      60
    ),
    (
      '33333333-3333-4333-8333-333333333305'::uuid,
      '22222222-2222-4222-8222-222222222202'::uuid,
      'honey',
      'Kəklikotu balı',
      'Dağ kəklikotundan toplanmış təbii bal (500 qr).',
      'piece',
      15.00,
      18.00,
      25
    ),
    (
      '33333333-3333-4333-8333-333333333306'::uuid,
      '22222222-2222-4222-8222-222222222202'::uuid,
      'herbs',
      'Göyərti dəstəsi',
      'Cəfəri, keşniş, reyhan və soğan göyü — təzə dəstə.',
      'piece',
      2.00,
      2.50,
      50
    ),
    (
      '33333333-3333-4333-8333-333333333307'::uuid,
      '22222222-2222-4222-8222-222222222202'::uuid,
      'oils',
      'Zeytun yağı',
      'Soyuq preslənmiş əlavə virgin zeytun yağı (500 ml).',
      'liter',
      12.00,
      15.00,
      20
    ),
    (
      '33333333-3333-4333-8333-333333333308'::uuid,
      '22222222-2222-4222-8222-222222222203'::uuid,
      'fruits',
      'Çiyələk',
      'Quba bağlarından təzə çiyələk (500 qr).',
      'piece',
      5.00,
      6.00,
      35
    )
) as v(id, farmer_id, category_slug, title, description, unit_type, farmer_price, final_price, quantity_available)
join public.categories c on c.slug = v.category_slug
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Demo product images
-- ---------------------------------------------------------------------------
insert into public.product_images (product_id, url, sort_order)
select * from (
  values
    (
      '33333333-3333-4333-8333-333333333301'::uuid,
      'https://images.unsplash.com/photo-1546470427-e26264be0b5a?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333302'::uuid,
      'https://images.unsplash.com/photo-1449304865171-156efeaf8c58?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333303'::uuid,
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333304'::uuid,
      'https://images.unsplash.com/photo-1518569656558-1f25e68d93df?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333305'::uuid,
      'https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333306'::uuid,
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333307'::uuid,
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=1200&q=80',
      0
    ),
    (
      '33333333-3333-4333-8333-333333333308'::uuid,
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1200&q=80',
      0
    )
) as v(product_id, url, sort_order)
where not exists (
  select 1
  from public.product_images pi
  where pi.product_id = v.product_id
    and pi.url = v.url
);

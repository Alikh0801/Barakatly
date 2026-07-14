-- Remove Göyərti (herbs) category and all related catalog data.
-- Safe to re-run.

-- Order lines linked to herbs products
delete from public.order_items
where product_id in (
  select p.id
  from public.products p
  join public.categories c on c.id = p.category_id
  where c.slug = 'herbs'
);

-- Product images cascade via product_id FK
delete from public.products
where category_id in (
  select id from public.categories where slug = 'herbs'
);

delete from public.categories
where slug = 'herbs';

-- Keep sort order contiguous for remaining categories
update public.categories set sort_order = 6 where slug = 'grains';
update public.categories set sort_order = 7 where slug = 'oils';

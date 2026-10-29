-- ---------------------------------------------------------------------------
-- is_farmer_owner() only asks whether the farmer row belongs to the caller,
-- not whether it is approved. Every write policy used it, so a farmer still
-- waiting for approval (or one an admin suspended) could, straight through
-- the API, add and edit products, their sizes and pictures, write posts and
-- move their order lines and order events along. The site already stops
-- this (requireApprovedFarmer); the database now does too.
--
-- Writes go through is_approved_farmer_owner(), which also wants
-- status = 'approved'. Reads keep is_farmer_owner(), so a pending or
-- suspended farmer still sees their own products, posts, orders and payouts.
-- The column guards on farmers and products are migration 048.
--
-- "Status events visible to order parties" compared oi.order_id with itself,
-- so any farmer with an order line saw every order's events; it now looks at
-- the event's own order.
-- ---------------------------------------------------------------------------

create or replace function public.is_approved_farmer_owner(target_farmer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.farmers f
    where f.id = target_farmer_id
      and f.profile_id = auth.uid()
      and f.status = 'approved'::public.farmer_status
  );
$$;

grant execute on function public.is_approved_farmer_owner(uuid) to anon, authenticated;

-- products
drop policy if exists "Farmers can insert own products" on public.products;
create policy "Farmers can insert own products"
  on public.products for insert
  with check (public.is_approved_farmer_owner(farmer_id));

drop policy if exists "Farmers can update own products" on public.products;
create policy "Farmers can update own products"
  on public.products for update
  using (public.is_approved_farmer_owner(farmer_id) or public.is_admin())
  with check (public.is_approved_farmer_owner(farmer_id) or public.is_admin());

-- product_images, product_variants (reads stay with their own select policies)
drop policy if exists "Farmers manage own product images" on public.product_images;
create policy "Farmers manage own product images"
  on public.product_images for all
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (public.is_approved_farmer_owner(p.farmer_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (public.is_approved_farmer_owner(p.farmer_id) or public.is_admin())
  ));

drop policy if exists "Farmers manage own product variants" on public.product_variants;
create policy "Farmers manage own product variants"
  on public.product_variants for all
  using (exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and (public.is_approved_farmer_owner(p.farmer_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and (public.is_approved_farmer_owner(p.farmer_id) or public.is_admin())
  ));

-- order_items, order_status_events
drop policy if exists "Farmers update own order items" on public.order_items;
create policy "Farmers update own order items"
  on public.order_items for update
  using (public.is_approved_farmer_owner(farmer_id) or public.is_admin() or public.is_courier())
  with check (public.is_approved_farmer_owner(farmer_id) or public.is_admin() or public.is_courier());

drop policy if exists "Staff insert status events" on public.order_status_events;
create policy "Staff insert status events"
  on public.order_status_events for insert
  with check (
    public.is_admin()
    or public.is_courier()
    or exists (
      select 1 from public.order_items oi
      where oi.order_id = order_status_events.order_id
        and public.is_approved_farmer_owner(oi.farmer_id)
    )
  );

drop policy if exists "Status events visible to order parties" on public.order_status_events;
create policy "Status events visible to order parties"
  on public.order_status_events for select
  using (
    public.is_admin()
    or public.is_courier()
    or exists (
      select 1 from public.orders o
      where o.id = order_status_events.order_id and o.customer_id = auth.uid()
    )
    or exists (
      select 1 from public.order_items oi
      where oi.order_id = order_status_events.order_id
        and public.is_farmer_owner(oi.farmer_id)
    )
  );

-- farmer_posts, farmer_post_media
drop policy if exists "Farmers insert own posts" on public.farmer_posts;
create policy "Farmers insert own posts"
  on public.farmer_posts for insert
  with check (public.is_approved_farmer_owner(farmer_id) or public.is_admin());

drop policy if exists "Farmers update own posts" on public.farmer_posts;
create policy "Farmers update own posts"
  on public.farmer_posts for update
  using (public.is_approved_farmer_owner(farmer_id) or public.is_admin())
  with check (public.is_approved_farmer_owner(farmer_id) or public.is_admin());

drop policy if exists "Farmers delete own posts" on public.farmer_posts;
create policy "Farmers delete own posts"
  on public.farmer_posts for delete
  using (public.is_approved_farmer_owner(farmer_id) or public.is_admin());

drop policy if exists "Farmers manage own post media" on public.farmer_post_media;
create policy "Farmers manage own post media"
  on public.farmer_post_media for all
  using (exists (
    select 1 from public.farmer_posts p
    where p.id = farmer_post_media.post_id
      and (public.is_approved_farmer_owner(p.farmer_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from public.farmer_posts p
    where p.id = farmer_post_media.post_id
      and (public.is_approved_farmer_owner(p.farmer_id) or public.is_admin())
  ));

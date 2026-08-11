-- Per-account shopping cart, persisted server-side so it follows the user across devices

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity numeric(10, 2) not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create index cart_items_customer_id_idx on public.cart_items (customer_id);

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

create policy "Customers view own cart"
on public.cart_items for select
using (customer_id = auth.uid());

create policy "Customers add to own cart"
on public.cart_items for insert
with check (customer_id = auth.uid());

create policy "Customers update own cart"
on public.cart_items for update
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

create policy "Customers remove from own cart"
on public.cart_items for delete
using (customer_id = auth.uid());

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_category_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (category_id, product_id)
);

create index if not exists idx_product_categories_org_title on public.product_categories(org_id, title);
create index if not exists idx_product_category_items_category on public.product_category_items(category_id, sort_order, created_at);
create index if not exists idx_product_category_items_product on public.product_category_items(product_id);

drop trigger if exists touch_product_categories_updated_at on public.product_categories;
create trigger touch_product_categories_updated_at before update on public.product_categories
for each row execute function public.touch_updated_at();

alter table public.product_categories enable row level security;
alter table public.product_category_items enable row level security;

drop policy if exists "Members can read product categories" on public.product_categories;
create policy "Members can read product categories" on public.product_categories
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write product categories" on public.product_categories;
create policy "Members can write product categories" on public.product_categories
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

drop policy if exists "Members can read product category items" on public.product_category_items;
create policy "Members can read product category items" on public.product_category_items
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write product category items" on public.product_category_items;
create policy "Members can write product category items" on public.product_category_items
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

grant select, insert, update, delete on public.product_categories to authenticated;
grant select, insert, update, delete on public.product_category_items to authenticated;

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  account_type text not null default 'admin' check (account_type in ('admin', 'employee')),
  business_type text not null default 'org',
  product_type text not null default 'product',
  profession_type text not null default 'dealership',
  team_enabled boolean not null default true,
  org_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin', 'employee')),
  status text not null default 'active' check (status in ('invited', 'active', 'disabled')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  address text,
  gstin text,
  email text,
  phone text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  sku text,
  hsn text,
  name text not null,
  description text,
  cost_price numeric(14, 2) not null default 0,
  unit_price numeric(14, 2) not null default 0,
  shown_discount numeric(14, 2) not null default 0,
  extra_discount numeric(14, 2) not null default 0,
  gst_rate numeric(5, 2) not null default 18,
  inventory_qty numeric(14, 2) not null default 0,
  margin text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, sku)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  invoice_number text not null,
  status text not null default 'Pending Payment',
  billing_date date not null default current_date,
  due_date date,
  delivered boolean not null default false,
  note text not null default '',
  payment jsonb not null default '{}'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, invoice_number)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text,
  hsn text,
  name text not null,
  description text,
  cost_price numeric(14, 2) not null default 0,
  unit_price numeric(14, 2) not null default 0,
  shown_discount numeric(14, 2) not null default 0,
  extra_discount numeric(14, 2) not null default 0,
  gst_rate numeric(5, 2) not null default 18,
  quantity numeric(14, 2) not null default 1,
  sort_order integer not null default 0,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(14, 2) not null default 0,
  paid_at date not null default current_date,
  mode text,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_org_members_user on public.organization_members(user_id, status);
create index if not exists idx_customers_org_name on public.customers(org_id, name);
create index if not exists idx_products_org_name on public.products(org_id, name);
create index if not exists idx_invoices_org_billing on public.invoices(org_id, billing_date desc);
create index if not exists idx_invoice_items_invoice on public.invoice_items(invoice_id, sort_order);
create index if not exists idx_payment_logs_invoice on public.payment_logs(invoice_id, paid_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_organizations_updated_at on public.organizations;
create trigger touch_organizations_updated_at before update on public.organizations
for each row execute function public.touch_updated_at();

drop trigger if exists touch_customers_updated_at on public.customers;
create trigger touch_customers_updated_at before update on public.customers
for each row execute function public.touch_updated_at();

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists touch_invoices_updated_at on public.invoices;
create trigger touch_invoices_updated_at before update on public.invoices
for each row execute function public.touch_updated_at();

drop trigger if exists touch_invoice_items_updated_at on public.invoice_items;
create trigger touch_invoice_items_updated_at before update on public.invoice_items
for each row execute function public.touch_updated_at();

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.org_id = target_org_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.org_id = target_org_id
      and member.user_id = auth.uid()
      and member.role = 'admin'
      and member.status = 'active'
  );
$$;

create or replace function public.ensure_default_org(business_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_org_id uuid;
  next_org_id uuid;
  profile_email text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select org_id into existing_org_id
  from public.organization_members
  where user_id = current_user_id and status = 'active'
  order by created_at
  limit 1;

  if existing_org_id is not null then
    return existing_org_id;
  end if;

  select email into profile_email from public.profiles where id = current_user_id;

  insert into public.organizations (name, owner_id)
  values (coalesce(nullif(trim(business_name), ''), coalesce(profile_email, 'My Business')), current_user_id)
  returning id into next_org_id;

  insert into public.organization_members (org_id, user_id, role, status)
  values (next_org_id, current_user_id, 'admin', 'active');

  return next_org_id;
end;
$$;

grant execute on function public.ensure_default_org(text) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payment_logs enable row level security;

drop policy if exists "Members can read organizations" on public.organizations;
create policy "Members can read organizations" on public.organizations
for select to authenticated using (public.is_org_member(id));

drop policy if exists "Admins can update organizations" on public.organizations;
create policy "Admins can update organizations" on public.organizations
for update to authenticated using (public.is_org_admin(id)) with check (public.is_org_admin(id));

drop policy if exists "Members can read organization members" on public.organization_members;
create policy "Members can read organization members" on public.organization_members
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Admins can manage organization members" on public.organization_members;
create policy "Admins can manage organization members" on public.organization_members
for all to authenticated using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

drop policy if exists "Members can read customers" on public.customers;
create policy "Members can read customers" on public.customers
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write customers" on public.customers;
create policy "Members can write customers" on public.customers
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

drop policy if exists "Members can read products" on public.products;
create policy "Members can read products" on public.products
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write products" on public.products;
create policy "Members can write products" on public.products
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

drop policy if exists "Members can read invoices" on public.invoices;
create policy "Members can read invoices" on public.invoices
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write invoices" on public.invoices;
create policy "Members can write invoices" on public.invoices
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

drop policy if exists "Members can read invoice items" on public.invoice_items;
create policy "Members can read invoice items" on public.invoice_items
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write invoice items" on public.invoice_items;
create policy "Members can write invoice items" on public.invoice_items
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

drop policy if exists "Members can read payment logs" on public.payment_logs;
create policy "Members can read payment logs" on public.payment_logs
for select to authenticated using (public.is_org_member(org_id));

drop policy if exists "Members can write payment logs" on public.payment_logs;
create policy "Members can write payment logs" on public.payment_logs
for all to authenticated using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));

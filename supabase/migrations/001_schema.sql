create extension if not exists "pgcrypto";

create type payment_type as enum ('spot', 'emi', 'pay_later');
create type invoice_status as enum ('pending', 'paid', 'overdue', 'pending_delivery', 'issue_raised');
create type mail_type as enum ('invoice', 'reminder', 'custom');
create type mail_status as enum ('sent', 'failed');

create table if not exists company_profile (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  gstin text,
  email text,
  phone text,
  bank_name text,
  bank_account text,
  ifsc text,
  upi_id text,
  created_at timestamptz not null default now(),
  unique(owner_user_id)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  pincode text,
  gstin text,
  email text,
  phone text,
  loyalty_score int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  pid text not null,
  hsn_code text not null,
  name text not null,
  description text,
  upgrades text,
  cost_price numeric(14,2) not null default 0,
  profit_margin numeric(14,2) not null default 0,
  marked_price numeric(14,2) generated always as (cost_price + profit_margin) stored,
  gst_percent numeric(5,2) not null default 18,
  stock_total int not null default 0,
  stock_unbooked int not null default 0,
  stock_not_shipped int not null default 0,
  created_at timestamptz not null default now(),
  unique(company_id, pid)
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  invoice_number text not null,
  customer_id uuid not null references customers(id) on delete restrict,
  billing_date date not null,
  credit_days int not null default 0,
  closure_date date generated always as (billing_date + credit_days) stored,
  payment_type payment_type not null default 'spot',
  payment_done bool not null default false,
  freight_charges numeric(14,2) not null default 0,
  other_charges numeric(14,2) not null default 0,
  round_off numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  tax_total numeric(14,2) not null default 0,
  final_total numeric(14,2) not null default 0,
  payment_notes text,
  is_delivered bool not null default false,
  status invoice_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, invoice_number)
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  pid text not null,
  hsn_code text not null,
  name text not null,
  description text,
  upgrades text,
  cost_price numeric(14,2) not null default 0,
  profit_margin numeric(14,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  quantity int not null default 1,
  marked_price numeric(14,2) not null default 0,
  gst_percent numeric(5,2) not null default 18,
  unit_price numeric(14,2) not null default 0,
  total_price numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists payment_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount_paid numeric(14,2) not null,
  payment_date date not null,
  note text,
  payment_mode text,
  created_at timestamptz not null default now()
);

create table if not exists mail_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  type mail_type not null,
  subject text not null,
  body text not null,
  recipient_email text not null,
  status mail_status not null,
  sent_at timestamptz not null default now()
);

create table if not exists hsn_gst_rates (
  id uuid primary key default gen_random_uuid(),
  hsn_code text not null unique,
  description text not null,
  gst_percent numeric(5,2) not null
);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references company_profile(id) on delete cascade,
  gmail_smtp_user text,
  gmail_smtp_password text,
  reminder_days_before int not null default 3,
  emi_interest_rate numeric(5,2) not null default 1.50,
  pay_later_penalty_rate numeric(5,2) not null default 2.00,
  low_stock_threshold int not null default 5,
  updated_at timestamptz not null default now(),
  unique(company_id)
);

create index if not exists idx_customers_company on customers(company_id);
create index if not exists idx_products_company on products(company_id);
create index if not exists idx_invoices_company_status on invoices(company_id, status);
create index if not exists idx_invoice_items_invoice on invoice_items(invoice_id);
create index if not exists idx_payments_invoice on payment_history(invoice_id);
create index if not exists idx_mail_company on mail_logs(company_id, sent_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoices_updated_at on invoices;
create trigger invoices_updated_at before update on invoices
for each row execute function set_updated_at();

drop trigger if exists settings_updated_at on app_settings;
create trigger settings_updated_at before update on app_settings
for each row execute function set_updated_at();

alter table company_profile enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payment_history enable row level security;
alter table mail_logs enable row level security;
alter table app_settings enable row level security;
alter table hsn_gst_rates enable row level security;

create policy "company own profile" on company_profile for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "company read hsn" on hsn_gst_rates for select using (true);
create policy "company write hsn" on hsn_gst_rates for insert with check (auth.uid() is not null);

create policy "customers company scope" on customers for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

create policy "products company scope" on products for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

create policy "invoices company scope" on invoices for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

create policy "invoice_items company scope" on invoice_items for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

create policy "payments company scope" on payment_history for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

create policy "mail company scope" on mail_logs for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

create policy "settings company scope" on app_settings for all
using (company_id in (select id from company_profile where owner_user_id = auth.uid()))
with check (company_id in (select id from company_profile where owner_user_id = auth.uid()));

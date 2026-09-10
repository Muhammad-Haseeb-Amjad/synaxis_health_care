-- Synaxis Health Care — initial database schema
-- Apply with `supabase db push` or paste this file into the Supabase SQL editor.

create extension if not exists pgcrypto;

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  given_amount numeric not null default 0,
  percentage numeric not null default 0,
  required_business numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.doctor_entries (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  month date not null,
  product_name text not null,
  qty numeric not null,
  price numeric not null,
  business numeric generated always as (qty * price) stored,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  opening_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.customer_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  entry_date date not null,
  description text not null,
  debit numeric not null default 0,
  credit numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_label text not null check (group_label in ('A', 'B')),
  created_at timestamptz not null default now()
);

create table public.partnership_sales (
  id uuid primary key default gen_random_uuid(),
  group_label text not null check (group_label in ('A', 'B')),
  item_code text not null,
  item_name text not null,
  qty numeric not null,
  cost_price numeric not null,
  selling_price numeric not null,
  return_qty numeric not null default 0,
  return_cost numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.shared_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  opening_balance numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.vendor_ledger (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  entry_date date not null,
  description text not null,
  debit numeric not null default 0,
  credit numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,
  item_name text not null,
  unit_price numeric not null,
  tax_percent numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  order_date date not null,
  delivery_date date,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  vendor_name_snapshot text not null,
  vendor_address_snapshot text,
  vendor_phone_snapshot text,
  ship_to_name text not null,
  ship_to_address text,
  ship_to_phone text,
  note text,
  status text not null default 'Pending'
    check (status in ('Pending', 'Completed', 'Cancelled')),
  total_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  description text not null,
  qty numeric not null,
  price numeric not null,
  amount numeric generated always as (qty * price) stored,
  created_at timestamptz not null default now()
);

create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  admin_name text,
  phone text,
  email text,
  logo_url text,
  address text,
  created_at timestamptz not null default now()
);

-- Serializes number allocation so simultaneous inserts cannot receive the same PO number.
create or replace function public.generate_next_po_number()
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_number bigint;
begin
  lock table public.purchase_orders in share row exclusive mode;

  select coalesce(max(substring(po_number from '^PO([0-9]+)$')::bigint), 0) + 1
    into next_number
    from public.purchase_orders
   where po_number ~ '^PO[0-9]+$';

  return 'PO' || lpad(next_number::text, 6, '0');
end;
$$;

alter table public.purchase_orders
  alter column po_number set default public.generate_next_po_number();

create index doctor_entries_doctor_id_idx on public.doctor_entries(doctor_id);
create index customer_ledger_customer_date_idx on public.customer_ledger(customer_id, entry_date, created_at);
create index vendor_ledger_vendor_date_idx on public.vendor_ledger(vendor_id, entry_date, created_at);
create index purchase_orders_vendor_id_idx on public.purchase_orders(vendor_id);
create index purchase_order_items_order_id_idx on public.purchase_order_items(purchase_order_id);
create index purchase_order_items_product_id_idx on public.purchase_order_items(product_id);
-- Enforce the intended singleton company profile without adding an application-facing column.
create unique index company_settings_singleton_idx on public.company_settings ((true));

alter table public.doctors enable row level security;
alter table public.doctor_entries enable row level security;
alter table public.customers enable row level security;
alter table public.customer_ledger enable row level security;
alter table public.partners enable row level security;
alter table public.partnership_sales enable row level security;
alter table public.shared_expenses enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_ledger enable row level security;
alter table public.products enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.company_settings enable row level security;

create policy "Authenticated users have full access to doctors"
  on public.doctors for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to doctor entries"
  on public.doctor_entries for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to customers"
  on public.customers for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to customer ledger"
  on public.customer_ledger for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to partners"
  on public.partners for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to partnership sales"
  on public.partnership_sales for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to shared expenses"
  on public.shared_expenses for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to vendors"
  on public.vendors for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to vendor ledger"
  on public.vendor_ledger for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to products"
  on public.products for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to purchase orders"
  on public.purchase_orders for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to purchase order items"
  on public.purchase_order_items for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users have full access to company settings"
  on public.company_settings for all to authenticated
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on function public.generate_next_po_number() from public;
grant execute on function public.generate_next_po_number() to authenticated;
revoke all on function public.generate_next_po_number() from anon;


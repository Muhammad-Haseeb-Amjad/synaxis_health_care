-- Monthly partnership history, shared catalog pricing, partner draws, and PO/vendor-ledger synchronization.

alter table public.partnership_sales
  add column if not exists month date;
update public.partnership_sales set month = date_trunc('month', created_at)::date where month is null;
alter table public.partnership_sales alter column month set default date_trunc('month', current_date)::date;
alter table public.partnership_sales alter column month set not null;

alter table public.partnership_sales
  add column if not exists product_id uuid references public.products(id) on delete set null;
create index if not exists partnership_sales_month_idx on public.partnership_sales(month);
create index if not exists partnership_sales_product_id_idx on public.partnership_sales(product_id);

alter table public.shared_expenses add column if not exists expense_date date;
update public.shared_expenses set expense_date = created_at::date where expense_date is null;
alter table public.shared_expenses alter column expense_date set default current_date;
alter table public.shared_expenses alter column expense_date set not null;
create index if not exists shared_expenses_date_idx on public.shared_expenses(expense_date);

alter table public.products add column if not exists sale_price numeric;
update public.products set sale_price = unit_price where sale_price is null;
alter table public.products alter column sale_price set default 0;
alter table public.products alter column sale_price set not null;
alter table public.products drop constraint if exists products_sale_price_check;
alter table public.products add constraint products_sale_price_check check (sale_price >= 0);

alter table public.company_settings add column if not exists distributor_commission_percent numeric not null default 10;
alter table public.company_settings drop constraint if exists company_settings_distributor_commission_check;
alter table public.company_settings add constraint company_settings_distributor_commission_check check (distributor_commission_percent >= 0 and distributor_commission_percent <= 100);

create table if not exists public.partner_draws (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  entry_date date not null,
  description text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create index if not exists partner_draws_partner_date_idx on public.partner_draws(partner_id, entry_date, created_at);
alter table public.partner_draws enable row level security;
drop policy if exists "Authenticated users have full access to partner draws" on public.partner_draws;
create policy "Authenticated users have full access to partner draws" on public.partner_draws for all to authenticated using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
grant select, insert, update, delete on public.partner_draws to authenticated;

alter table public.vendor_ledger add column if not exists purchase_order_id uuid references public.purchase_orders(id) on delete cascade;
create unique index if not exists vendor_ledger_purchase_order_uidx on public.vendor_ledger(purchase_order_id) where purchase_order_id is not null;

create or replace function public.sync_purchase_order_vendor_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.vendor_ledger where purchase_order_id = old.id;
    return old;
  end if;

  if new.status = 'Cancelled' then
    delete from public.vendor_ledger where purchase_order_id = new.id;
  else
    insert into public.vendor_ledger (vendor_id, purchase_order_id, entry_date, description, debit, credit)
    values (new.vendor_id, new.id, new.order_date, 'Auto: ' || new.po_number, new.total_amount, 0)
    on conflict (purchase_order_id) where purchase_order_id is not null do update
      set vendor_id = excluded.vendor_id,
          entry_date = excluded.entry_date,
          description = excluded.description,
          debit = excluded.debit,
          credit = 0;
  end if;
  return new;
end;
$$;

drop trigger if exists purchase_order_vendor_ledger_sync on public.purchase_orders;
create trigger purchase_order_vendor_ledger_sync
after insert or update of vendor_id, order_date, total_amount, status, po_number or delete
on public.purchase_orders for each row execute function public.sync_purchase_order_vendor_ledger();

insert into public.vendor_ledger (vendor_id, purchase_order_id, entry_date, description, debit, credit)
select po.vendor_id, po.id, po.order_date, 'Auto: ' || po.po_number, po.total_amount, 0
from public.purchase_orders po
where po.status <> 'Cancelled'
  and not exists (select 1 from public.vendor_ledger vl where vl.purchase_order_id = po.id);
-- Align purchase orders with the client's Product Master tax workflow.
alter table public.purchase_order_items
  add column if not exists tax_percent numeric not null default 0;

alter table public.purchase_order_items
  drop constraint if exists purchase_order_items_tax_percent_check;
alter table public.purchase_order_items
  add constraint purchase_order_items_tax_percent_check check (tax_percent >= 0 and tax_percent <= 100);

-- Generated columns cannot have their expression altered in-place.
alter table public.purchase_order_items drop column if exists amount;
alter table public.purchase_order_items
  add column amount numeric generated always as
    (qty * price * (1 + tax_percent / 100.0)) stored;

-- Snapshot existing product tax when possible; existing custom lines remain zero-tax.
update public.purchase_order_items poi
set tax_percent = p.tax_percent
from public.products p
where poi.product_id = p.id
  and poi.tax_percent = 0;

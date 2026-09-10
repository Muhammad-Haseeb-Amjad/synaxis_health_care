-- Remove only Synaxis demo records created by demo_seed.sql.
begin;
delete from public.purchase_order_items where id::text like '61000000-0000-4000-8000-%';
delete from public.purchase_orders where id::text like '60000000-0000-4000-8000-%';
delete from public.vendor_ledger where id::text like '41000000-0000-4000-8000-%';
delete from public.vendors where id::text like '40000000-0000-4000-8000-%';
delete from public.products where id::text like '50000000-0000-4000-8000-%';
delete from public.shared_expenses where id::text like '32000000-0000-4000-8000-%';
delete from public.partner_draws where id::text like '33000000-0000-4000-8000-%';
delete from public.partnership_sales where id::text like '31000000-0000-4000-8000-%';
delete from public.partners where id::text like '30000000-0000-4000-8000-%';
delete from public.customer_ledger where id::text like '21000000-0000-4000-8000-%';
delete from public.customers where id::text like '20000000-0000-4000-8000-%';
delete from public.doctor_entries where id::text like '11000000-0000-4000-8000-%';
delete from public.doctors where id::text like '10000000-0000-4000-8000-%';
commit;
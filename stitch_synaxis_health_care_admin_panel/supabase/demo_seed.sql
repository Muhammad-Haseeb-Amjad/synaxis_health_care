-- Synaxis Health Care demo data (MANUAL ONLY)
-- This file is intentionally outside supabase/migrations and is not run by builds or db push.
-- All demo records use deterministic UUID prefixes, so reruns replace only demo data.

begin;

-- Remove a prior copy of this demo dataset only. Parent cascades handle owned rows.
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

-- 10 doctors. required_business is stored in the real schema and follows given / (percentage / 100).
with source(name, given_amount, percentage) as (
  values
    ('Dr. Ahmed Raza', 12000::numeric, 10::numeric), ('Dr. Ayesha Khan', 15000, 15),
    ('Dr. Bilal Mahmood', 9000, 10), ('Dr. Fatima Noor', 18000, 12),
    ('Dr. Hamza Ali', 10000, 8), ('Dr. Hira Shah', 14000, 20),
    ('Dr. Imran Qureshi', 11000, 10), ('Dr. Mahnoor Siddiqui', 16000, 16),
    ('Dr. Saad Akhtar', 13000, 10), ('Dr. Zainab Tariq', 17500, 14)
), numbered as (select row_number() over () i, * from source)
insert into public.doctors(id, name, given_amount, percentage, required_business, created_at)
select ('10000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid, name, given_amount, percentage,
       round(given_amount / (percentage / 100), 2), now() - ((11-i) || ' days')::interval
from numbered;

-- 30 doctor entries (3 per doctor), spread across recent months with varied achievement.
insert into public.doctor_entries(id, doctor_id, month, product_name, qty, price, created_at)
select ('11000000-0000-4000-8000-' || lpad(((d-1)*3+m)::text,12,'0'))::uuid,
       ('10000000-0000-4000-8000-' || lpad(d::text,12,'0'))::uuid,
       (date_trunc('month', current_date) - ((3-m) || ' months')::interval)::date,
       (array['Panadol 500mg','Augmentin 625mg','Brufen 400mg'])[m],
       case when d <= 4 then 90 + d*8 + m*5 else 18 + d*2 + m end,
       (array[520,780,430]::numeric[])[m], now() - ((d*3+m) || ' hours')::interval
from generate_series(1,10) d cross join generate_series(1,3) m;

-- 10 customers.
with source(name, phone, opening_balance) as (
  values
    ('Al-Shifa Pharmacy','0300-1234567',25000::numeric), ('City Medical Store','0301-2345678',18500),
    ('Madina Pharmacy','0302-3456789',12000), ('Care Plus Medical','0303-4567890',30000),
    ('Rehman Chemist','0304-5678901',9500), ('Health Point Pharmacy','0305-6789012',22000),
    ('Punjab Medical Hall','0306-7890123',15000), ('New Lahore Pharmacy','0307-8901234',27000),
    ('Multan Medicine House','0308-9012345',13500), ('Vehari Care Pharmacy','0309-0123456',8000)
), numbered as (select row_number() over () i, * from source)
insert into public.customers(id,name,phone,opening_balance,created_at)
select ('20000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,name,phone,opening_balance,now()-(i||' days')::interval from numbered;

-- 30 customer ledger rows (3 per customer).
insert into public.customer_ledger(id,customer_id,entry_date,description,debit,credit,created_at)
select ('21000000-0000-4000-8000-' || lpad(((c-1)*3+m)::text,12,'0'))::uuid,
       ('20000000-0000-4000-8000-' || lpad(c::text,12,'0'))::uuid,
       (current_date - ((4-m)*30 + c)::int),
       (array['Monthly medicine supply','Partial payment received','Additional stock supplied'])[m],
       case when m in (1,3) then 8000 + c*1250 + m*500 else 0 end,
       case when m=2 then 6000 + c*900 else 0 end,
       now()-(((c-1)*3+m)||' hours')::interval
from generate_series(1,10) c cross join generate_series(1,3) m;

-- Two partner identity rows are correct for the real A/B model.
insert into public.partners(id,name,group_label,created_at) values
('30000000-0000-4000-8000-000000000001','Hanan Liaquat','A',now()-interval '20 days'),
('30000000-0000-4000-8000-000000000002','Usman Khalid','B',now()-interval '20 days');


-- 10 partner given/draw ledger entries.
insert into public.partner_draws(id,partner_id,entry_date,description,amount,created_at)
select ('33000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
       ('30000000-0000-4000-8000-'||lpad((case when i%2=1 then 1 else 2 end)::text,12,'0'))::uuid,
       current_date-(i*8), 'Demo partner draw', 5000+i*1250, now()-(i||' days')::interval
from generate_series(1,10) i;
-- 20 partnership sales: exactly 10 per group.
insert into public.partnership_sales(id,group_label,item_code,item_name,qty,cost_price,selling_price,return_qty,return_cost,month,created_at)
select ('31000000-0000-4000-8000-' || lpad(i::text,12,'0'))::uuid,
       case when i<=10 then 'A' else 'B' end,
       'MED-' || lpad(i::text,3,'0'),
       (array['Panadol 500mg','Brufen 400mg','Augmentin 625mg','Calpol Syrup','Disprin Tablets','Risek 20mg','Flagyl 400mg','Cac-1000 Plus','Surbex-Z','Arinac Forte'])[((i-1)%10)+1],
       20 + i*3, 90 + ((i-1)%10)*35, 125 + ((i-1)%10)*48,
       case when i in (4,9,13,18) then 2 else 0 end,
       case when i in (4,9,13,18) then (90 + ((i-1)%10)*35)*2 else 0 end,
       (date_trunc('month', current_date) - (((i-1)%4) || ' months')::interval)::date,
       now() - ((21-i)||' days')::interval
from generate_series(1,20) i;

-- 10 shared expenses.
with source(description,amount,notes) as (values
 ('Shop Rent',35000::numeric,'Monthly Lahore office rent'),('Staff Salaries',85000,'Sales and warehouse staff'),
 ('Electricity Bill',18000,'Monthly utility bill'),('Delivery Fuel',22000,'Local deliveries'),
 ('Internet and Phone',6500,'Business communications'),('Warehouse Maintenance',12000,'Routine maintenance'),
 ('Marketing Material',15000,'Doctor and pharmacy material'),('Vehicle Maintenance',19500,'Delivery van service'),
 ('Office Supplies',7500,'Stationery and printing'),('Bank Charges',4200,'Transfers and account charges')
), numbered as (select row_number() over () i,* from source)
insert into public.shared_expenses(id,description,amount,notes,created_at,expense_date)
select ('32000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,description,amount,notes,now()-(i||' days')::interval,current_date-(i*9) from numbered;

-- 10 vendors.
with source(name,phone,address,opening_balance) as (values
 ('Getz Pharma Distribution','0310-1234567','Kot Lakhpat, Lahore',45000::numeric),
 ('GSK Trade Centre','0311-2345678','Korangi Industrial Area, Karachi',62000),
 ('High-Q Pharmaceuticals','0312-3456789','Multan Road, Lahore',38000),
 ('Sami Pharmaceuticals','0313-4567890','SITE Area, Karachi',55000),
 ('Martin Dow Supplies','0314-5678901','Gulberg III, Lahore',41000),
 ('Hilton Pharma Depot','0315-6789012','Shahrah-e-Faisal, Karachi',29500),
 ('CCL Distribution','0316-7890123','Industrial Estate, Multan',36000),
 ('Ferozsons Laboratories','0317-8901234','Canal Bank Road, Lahore',48000),
 ('Bosch Pharma Traders','0318-9012345','Vehari Road, Multan',27500),
 ('AGP Medical Supplies','0319-0123456','Johar Town, Lahore',52000)
), numbered as (select row_number() over () i,* from source)
insert into public.vendors(id,name,phone,address,opening_balance,created_at)
select ('40000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,name,phone,address,opening_balance,now()-(i||' days')::interval from numbered;

-- 30 vendor ledger rows (3 per vendor).
insert into public.vendor_ledger(id,vendor_id,entry_date,description,debit,credit,created_at)
select ('41000000-0000-4000-8000-'||lpad(((v-1)*3+m)::text,12,'0'))::uuid,
 ('40000000-0000-4000-8000-'||lpad(v::text,12,'0'))::uuid,
 current_date-((4-m)*28+v)::int,
 (array['Medicine stock purchased','Bank payment made','Supplementary stock received'])[m],
 case when m in (1,3) then 18000+v*2200+m*700 else 0 end,
 case when m=2 then 14000+v*1500 else 0 end,
 now()-(((v-1)*3+m)||' hours')::interval
from generate_series(1,10) v cross join generate_series(1,3) m;

-- 10 products.
with source(item_code,item_name,unit_price,tax_percent) as (values
 ('PAN-500','Panadol 500mg Tablets',120::numeric,0::numeric),('BRU-400','Brufen 400mg Tablets',185,5),
 ('AUG-625','Augmentin 625mg Tablets',850,10),('CAL-120','Calpol Syrup 120ml',210,0),
 ('DIS-300','Disprin Tablets',95,0),('RIS-020','Risek 20mg Capsules',340,5),
 ('FLA-400','Flagyl 400mg Tablets',275,5),('CAC-100','Cac-1000 Plus',520,10),
 ('SUR-Z30','Surbex-Z 30 Tablets',690,10),('ARI-F10','Arinac Forte 10 Tablets',160,5)
), numbered as (select row_number() over () i,* from source)
insert into public.products(id,item_code,item_name,unit_price,tax_percent,created_at,sale_price)
select ('50000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,item_code,item_name,unit_price,tax_percent,now()-(i||' days')::interval,round(unit_price*1.25,2) from numbered;

-- 10 purchase orders. Ordered/Received are not valid in the real status check, so use Pending/Completed/Cancelled.
insert into public.purchase_orders(id,po_number,order_date,delivery_date,vendor_id,vendor_name_snapshot,vendor_address_snapshot,vendor_phone_snapshot,ship_to_name,ship_to_address,ship_to_phone,note,status,total_amount,created_at)
select ('60000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 'DEMO-PO'||lpad(i::text,6,'0'), current_date-(i*7), current_date-(i*7)+3,
 ('40000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
 (array['Getz Pharma Distribution','GSK Trade Centre','High-Q Pharmaceuticals','Sami Pharmaceuticals','Martin Dow Supplies','Hilton Pharma Depot','CCL Distribution','Ferozsons Laboratories','Bosch Pharma Traders','AGP Medical Supplies'])[i],
 (array['Kot Lakhpat, Lahore','Korangi Industrial Area, Karachi','Multan Road, Lahore','SITE Area, Karachi','Gulberg III, Lahore','Shahrah-e-Faisal, Karachi','Industrial Estate, Multan','Canal Bank Road, Lahore','Vehari Road, Multan','Johar Town, Lahore'])[i],
 '031'||(i-1)::text||'-'||lpad((1234567+i*111111)::text,7,'0'),
 'Synaxis Health Care Warehouse','College Road, Burewala, Vehari','0344-7407107',
 'Demo stock order — verify quantities on receipt.',
 case when i in (1,2,5,8) then 'Completed' when i in (4,9) then 'Cancelled' else 'Pending' end,
 0, now()-(i||' days')::interval
from generate_series(1,10) i;

-- 30 PO items (3 per order), linked to seeded products. amount is generated by the database.
insert into public.purchase_order_items(id,purchase_order_id,product_id,description,qty,price,tax_percent,created_at)
select ('61000000-0000-4000-8000-'||lpad(((po-1)*3+line)::text,12,'0'))::uuid,
 ('60000000-0000-4000-8000-'||lpad(po::text,12,'0'))::uuid,
 ('50000000-0000-4000-8000-'||lpad((((po+line-2)%10)+1)::text,12,'0'))::uuid,
 (array['Panadol 500mg Tablets','Brufen 400mg Tablets','Augmentin 625mg Tablets','Calpol Syrup 120ml','Disprin Tablets','Risek 20mg Capsules','Flagyl 400mg Tablets','Cac-1000 Plus','Surbex-Z 30 Tablets','Arinac Forte 10 Tablets'])[((po+line-2)%10)+1],
 10+po*2+line,
 (array[120,185,850,210,95,340,275,520,690,160]::numeric[])[((po+line-2)%10)+1],
 (array[0,5,10,0,0,5,5,10,10,5]::numeric[])[((po+line-2)%10)+1],
 now()-(((po-1)*3+line)||' hours')::interval
from generate_series(1,10) po cross join generate_series(1,3) line;

-- Persist each PO's exact generated tax-inclusive line total.
update public.purchase_orders po
set total_amount = totals.total
from (select purchase_order_id, sum(amount) total from public.purchase_order_items where id::text like '61000000-0000-4000-8000-%' group by purchase_order_id) totals
where po.id=totals.purchase_order_id;

-- Fail and roll back if this file did not create the intended demo cardinalities.
do $$
begin
  if (select count(*) from public.doctors where id::text like '10000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo doctors'; end if;
  if (select count(*) from public.doctor_entries where id::text like '11000000-0000-4000-8000-%') <> 30 then raise exception 'Expected 30 demo doctor entries'; end if;
  if (select count(*) from public.customers where id::text like '20000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo customers'; end if;
  if (select count(*) from public.customer_ledger where id::text like '21000000-0000-4000-8000-%') <> 30 then raise exception 'Expected 30 demo customer ledger rows'; end if;
  if (select count(*) from public.partners where id::text like '30000000-0000-4000-8000-%') <> 2 then raise exception 'Expected 2 demo partners'; end if;
  if (select count(*) from public.partner_draws where id::text like '33000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo partner draws'; end if;
  if (select count(*) from public.partnership_sales where id::text like '31000000-0000-4000-8000-%') <> 20 then raise exception 'Expected 20 demo partnership sales'; end if;
  if (select count(*) from public.shared_expenses where id::text like '32000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo expenses'; end if;
  if (select count(*) from public.vendors where id::text like '40000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo vendors'; end if;
  if (select count(*) from public.vendor_ledger where id::text like '41000000-0000-4000-8000-%') <> 30 then raise exception 'Expected 30 demo vendor ledger rows'; end if;
  if (select count(*) from public.products where id::text like '50000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo products'; end if;
  if (select count(*) from public.purchase_orders where id::text like '60000000-0000-4000-8000-%') <> 10 then raise exception 'Expected 10 demo purchase orders'; end if;
  if (select count(*) from public.purchase_order_items where id::text like '61000000-0000-4000-8000-%') <> 30 then raise exception 'Expected 30 demo purchase order items'; end if;
end $$;
commit;
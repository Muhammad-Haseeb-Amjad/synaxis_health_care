-- A business date separate from the immutable creation timestamp.
alter table public.doctors add column if not exists entry_date date;

-- Preserve the historical date for existing doctors; do not replace it with today.
update public.doctors
set entry_date = (created_at at time zone 'Asia/Karachi')::date
where entry_date is null;

alter table public.doctors alter column entry_date set default current_date;
alter table public.doctors alter column entry_date set not null;

-- doctor_entries.month is already a DATE and now stores the selected day as well.
-- Existing monthly entries retain their original recorded date.

alter table public.shared_expenses
  add column if not exists paid_by text not null default 'partner1';

alter table public.shared_expenses
  drop constraint if exists shared_expenses_paid_by_check;

alter table public.shared_expenses
  add constraint shared_expenses_paid_by_check
  check (paid_by in ('partner1', 'partner2'));


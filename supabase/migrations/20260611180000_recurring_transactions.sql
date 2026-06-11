
-- Table: RecurringTransaction
create table public."RecurringTransaction" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  category_id uuid not null references public."Category"(id) on delete cascade,
  frequency text not null check (frequency in ('monthly', 'yearly')),
  start_date date not null,
  active boolean default true,
  note text,
  created_at timestamptz default now()
);

-- Add reference to Transaction table
alter table public."Transaction" 
add column recurring_transaction_id uuid references public."RecurringTransaction"(id) on delete set null;

-- Enable RLS for RecurringTransaction
alter table public."RecurringTransaction" enable row level security;

-- Policies for RecurringTransaction
create policy "Users can manage their own RecurringTransactions"
on public."RecurringTransaction" for all
using (auth.uid() = user_id);

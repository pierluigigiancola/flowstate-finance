
-- Table: MacroCategory
create table public."MacroCategory" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

-- Table: Category
create table public."Category" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  macro_category_id uuid not null references public."MacroCategory"(id) on delete cascade,
  created_at timestamptz default now()
);

-- Table: Transaction
create table public."Transaction" (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  date date not null,
  category_id uuid not null references public."Category"(id) on delete cascade,
  is_recurrent boolean default false,
  note text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public."MacroCategory" enable row level security;
alter table public."Category" enable row level security;
alter table public."Transaction" enable row level security;

-- Policies
create policy "Users can manage their own MacroCategories"
on public."MacroCategory" for all
using (auth.uid() = user_id);

create policy "Users can manage their own Categories"
on public."Category" for all
using (auth.uid() = user_id);

create policy "Users can manage their own Transactions"
on public."Transaction" for all
using (auth.uid() = user_id);

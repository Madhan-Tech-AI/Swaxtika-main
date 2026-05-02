-- ============================================================
-- SWAXTIKA — Orders Table Setup (Safe to re-run)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Drop old table if it exists with wrong schema, then recreate cleanly
drop table if exists public.orders cascade;

-- 2. Create orders table fresh
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  shipping_fee numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  payment_method text,
  status text not null default 'Pending',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Enable Row Level Security
alter table public.orders enable row level security;

-- 4. RLS Policies (single SELECT policy — authenticated users see all orders)
create policy "Authenticated users can view orders."
  on public.orders for select
  using (auth.role() = 'authenticated');

create policy "Users can create own orders."
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Authenticated users can update orders."
  on public.orders for update
  using (auth.role() = 'authenticated');

-- 5. Updated_at trigger function (safe replace)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- 6. Reload schema cache
notify pgrst, 'reload schema';

-- ============================================================
-- DONE. Now place a test order to verify it works.
-- ============================================================

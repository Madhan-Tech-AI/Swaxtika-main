-- Create the cart_items table (safe to re-run)
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- Set up Row Level Security (RLS)
alter table public.cart_items enable row level security;

-- Drop existing policies first so this script is safe to re-run
drop policy if exists "Users can view their own cart items." on public.cart_items;
drop policy if exists "Users can insert their own cart items." on public.cart_items;
drop policy if exists "Users can update their own cart items." on public.cart_items;
drop policy if exists "Users can delete their own cart items." on public.cart_items;

-- Recreate Policies
create policy "Users can view their own cart items."
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own cart items."
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cart items."
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cart items."
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- Trigger for updated_at (safe to re-run)
drop trigger if exists handle_updated_at on public.cart_items;
create trigger handle_updated_at before update on public.cart_items
  for each row execute procedure moddatetime (updated_at);

-- Force Supabase API to reload the schema cache
NOTIFY pgrst, 'reload schema';


-- Create the wishlists table (safe to re-run)
create table if not exists public.wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  product_id uuid references public.products on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- Set up Row Level Security (RLS)
alter table public.wishlists enable row level security;

-- Drop existing policies first so this script is safe to re-run
drop policy if exists "Users can view their own wishlist items." on public.wishlists;
drop policy if exists "Users can insert their own wishlist items." on public.wishlists;
drop policy if exists "Users can delete their own wishlist items." on public.wishlists;

-- Recreate Policies
create policy "Users can view their own wishlist items."
  on public.wishlists for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wishlist items."
  on public.wishlists for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own wishlist items."
  on public.wishlists for delete
  using (auth.uid() = user_id);

-- Create an index to quickly fetch wishlist items for a user
create index if not exists idx_wishlists_user_id on public.wishlists(user_id);

-- Force Supabase API to reload the schema cache
NOTIFY pgrst, 'reload schema';

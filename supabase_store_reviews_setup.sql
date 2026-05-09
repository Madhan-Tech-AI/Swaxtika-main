-- Create store_reviews table
create table if not exists public.store_reviews (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.seller_applications(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.store_reviews enable row level security;

-- Policies
create policy "Store reviews are viewable by everyone" on public.store_reviews for select using (true);
create policy "Authenticated users can insert store reviews" on public.store_reviews for insert with check (auth.uid() = user_id);

-- Index for performance
create index if not exists idx_store_reviews_seller_id on public.store_reviews(seller_id);

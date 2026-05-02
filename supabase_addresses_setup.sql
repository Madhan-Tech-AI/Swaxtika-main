-- Create a table for user addresses
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text, -- e.g., Home, Office
  door_no text,
  street text,
  city text,
  state text,
  pincode text,
  lat numeric,
  lng numeric,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.addresses enable row level security;

create policy "Users can view their own addresses." on addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own addresses." on addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own addresses." on addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own addresses." on addresses
  for delete using (auth.uid() = user_id);

-- Set up triggers for updated_at
create extension if not exists moddatetime schema extensions;

create trigger handle_addresses_updated_at before update on addresses
  for each row execute procedure moddatetime (updated_at);

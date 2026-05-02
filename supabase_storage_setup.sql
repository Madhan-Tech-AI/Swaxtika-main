-- Ensure the profiles table has the is_admin column for access control
alter table public.profiles add column if not exists is_admin boolean default false;

-- Create the storage bucket for product images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set up security policies for the product-images bucket
-- Drop them if they exist to allow re-running the script safely
drop policy if exists "Product Images Public Access" on storage.objects;
drop policy if exists "Product Images Admin Upload Access" on storage.objects;
drop policy if exists "Product Images Admin Delete Access" on storage.objects;

-- Allow public read access to all files
create policy "Product Images Public Access"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

-- Allow authenticated admins to upload files
create policy "Product Images Admin Upload Access"
  on storage.objects for insert
  with check ( 
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated' 
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Allow authenticated admins to delete files
create policy "Product Images Admin Delete Access"
  on storage.objects for delete
  using ( 
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated' 
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- ========================================================
-- DEV HELPER: MAKE EXISTING USERS ADMINS
-- (Run this to fix the RLS error when uploading images!)
-- ========================================================
update public.profiles set is_admin = true;

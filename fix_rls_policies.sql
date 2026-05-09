-- ============================================================
-- FIX: Products RLS Policies — Remove auth.users references
-- 
-- PROBLEM: The current RLS policies on the `products` table reference 
-- `auth.users` directly, which the `authenticated` role CANNOT access.
-- This causes a 403 Forbidden error on ALL product queries.
--
-- Error: "permission denied for table users" (code 42501)
-- Hint: "GRANT SELECT ON auth.users TO authenticated"
--
-- SOLUTION: Use a SECURITY DEFINER function to safely look up the 
-- seller's email from auth.users, then match against seller_applications.
--
-- Run this ONCE in Supabase SQL Editor.
-- ============================================================

-- =====================
-- Step 1: Drop ALL existing product policies to start clean
-- =====================
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can read own products" ON public.products;
DROP POLICY IF EXISTS "Admins full access on products" ON public.products;
DROP POLICY IF EXISTS "Admins can do anything to products" ON public.products;
DROP POLICY IF EXISTS "Allow public all access on products for development" ON public.products;
DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;

-- =====================
-- Step 2: Ensure RLS is enabled
-- =====================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================
-- Step 3: Ensure profiles table has a `role` column
-- =====================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';

-- =====================
-- Step 4: Ensure seller_applications has user_id column BEFORE function uses it
-- =====================
ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS user_id UUID;

-- =====================
-- Step 5: Create SECURITY DEFINER function to get seller IDs
-- This runs with elevated privileges so it CAN read auth.users
-- =====================
CREATE OR REPLACE FUNCTION public.get_my_seller_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT sa.id 
  FROM public.seller_applications sa
  WHERE sa.status = 'approved'
  AND (
    -- Match by email from auth.users (SECURITY DEFINER can access this)
    sa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    -- OR match by user_id if the column exists and is populated
    OR sa.user_id = auth.uid()
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_seller_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_seller_ids() TO anon;

-- =====================
-- Step 6: Ensure seller_applications RLS allows reads
-- =====================
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read seller_applications" ON public.seller_applications;
CREATE POLICY "Anyone can read seller_applications"
  ON public.seller_applications FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage seller_applications" ON public.seller_applications;
CREATE POLICY "Admins manage seller_applications"
  ON public.seller_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================
-- Step 7: Create CLEAN product policies using the helper function
-- =====================

-- 1. Anyone (including anonymous/unauthenticated) can read active products
CREATE POLICY "Anyone can read active products"
  ON public.products
  FOR SELECT
  USING (status = 'Active');

-- 2. Sellers can READ all their own products (Active, Draft, etc.)
CREATE POLICY "Sellers can read own products"
  ON public.products
  FOR SELECT
  USING (
    seller_id IN (SELECT public.get_my_seller_ids())
  );

-- 3. Admins have FULL access to ALL products (including non-Active ones)
CREATE POLICY "Admins full access on products"
  ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Sellers can INSERT their own products
CREATE POLICY "Sellers can insert own products"
  ON public.products
  FOR INSERT
  WITH CHECK (
    seller_id IN (SELECT public.get_my_seller_ids())
  );

-- 5. Sellers can UPDATE their own products
CREATE POLICY "Sellers can update own products"
  ON public.products
  FOR UPDATE
  USING (
    seller_id IN (SELECT public.get_my_seller_ids())
  );

-- 6. Sellers can DELETE their own products
CREATE POLICY "Sellers can delete own products"
  ON public.products
  FOR DELETE
  USING (
    seller_id IN (SELECT public.get_my_seller_ids())
  );

-- =====================
-- Step 8: Fix orders policies
-- =====================
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================
-- Step 9: Fix order_items policies
-- =====================
DROP POLICY IF EXISTS "Sellers can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Sellers can view own order items"
  ON public.order_items FOR SELECT
  USING (
    seller_id IN (SELECT public.get_my_seller_ids())
  );

CREATE POLICY "Admins can view all order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================
-- Step 10: Fix carousel_items policies  
-- =====================
DROP POLICY IF EXISTS "Anyone can read active carousel" ON public.carousel_items;
DROP POLICY IF EXISTS "Admins manage carousel" ON public.carousel_items;

CREATE POLICY "Anyone can read active carousel"
  ON public.carousel_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage carousel"
  ON public.carousel_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================
-- Step 11: Fix banners policies
-- =====================
DROP POLICY IF EXISTS "Anyone can read banners" ON public.banners;
DROP POLICY IF EXISTS "Admins manage banners" ON public.banners;

CREATE POLICY "Anyone can read banners"
  ON public.banners FOR SELECT
  USING (true);

CREATE POLICY "Admins manage banners"
  ON public.banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================
-- Step 12: Ensure profiles policies allow reading for role checks
-- =====================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- =====================
-- Step 13: Fix any products with NULL status
-- =====================
UPDATE public.products SET status = 'Active' WHERE status IS NULL;

-- =====================
-- Step 14: Reload PostgREST schema cache
-- =====================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! After running this:
-- 1. Admin dashboard will be able to read ALL products
-- 2. Main site will show active products  
-- 3. Sellers can manage their own products (INSERT, READ, UPDATE, DELETE)
-- 4. No more 403 errors or auth.users permission issues
-- 5. The SECURITY DEFINER function safely bridges the auth.users gap
-- ============================================================

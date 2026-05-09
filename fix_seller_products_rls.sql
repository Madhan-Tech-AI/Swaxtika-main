-- ============================================================
-- FIX: Seller Cannot Add/View Products
-- 
-- ROOT CAUSES:
-- 1. No SELECT policy for sellers — sellers can only see 'Active' 
--    products (public read), so they can't see their own Drafts.
-- 2. INSERT/UPDATE/DELETE policies use auth.email() which can be 
--    unreliable. Switching to auth.uid() → profiles → email chain.
-- 3. seller_applications table may have RLS blocking subquery access.
--
-- Run this ONCE in Supabase SQL Editor.
-- ============================================================

-- =====================
-- Step 1: Ensure seller_applications has correct RLS
-- =====================
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read seller_applications (needed for RLS subqueries)
DROP POLICY IF EXISTS "Anyone can read seller_applications" ON public.seller_applications;
CREATE POLICY "Anyone can read seller_applications"
  ON public.seller_applications FOR SELECT
  USING (true);

-- Admins can manage all seller_applications
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
-- Step 2: Drop ALL existing product policies
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
-- Step 3: Ensure RLS is enabled
-- =====================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================
-- Step 4: Ensure seller_applications has user_id column BEFORE function uses it
-- =====================
ALTER TABLE public.seller_applications ADD COLUMN IF NOT EXISTS user_id UUID;

-- =====================
-- Step 5: Create a helper function to get seller_application IDs for current user
-- This avoids repeating the subquery and handles auth.email() vs auth.uid()
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
    -- Match by email from auth.users JWT
    sa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    -- OR match by user_id if the column exists
    OR sa.user_id = auth.uid()
  );
$$;

-- Grant execute to authenticated & anon users
GRANT EXECUTE ON FUNCTION public.get_my_seller_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_seller_ids() TO anon;

-- =====================
-- Step 6: Create CLEAN product policies
-- =====================

-- 1. Anyone (including anonymous) can read ACTIVE products
CREATE POLICY "Anyone can read active products"
  ON public.products
  FOR SELECT
  USING (status = 'Active');

-- 2. Sellers can read ALL their own products (including Draft, Inactive)
CREATE POLICY "Sellers can read own products"
  ON public.products
  FOR SELECT
  USING (
    seller_id IN (SELECT public.get_my_seller_ids())
  );

-- 3. Admins have FULL access to ALL products
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
-- Step 7: Ensure profiles are readable (needed for admin check subqueries)
-- =====================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

-- =====================
-- Step 8: Reload PostgREST schema cache
-- =====================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! After running this:
-- 1. Sellers can INSERT products (using auth.uid() lookup)
-- 2. Sellers can READ all their own products (not just Active)
-- 3. Sellers can UPDATE and DELETE their own products
-- 4. Public users can still read Active products
-- 5. Admins retain full access
-- ============================================================

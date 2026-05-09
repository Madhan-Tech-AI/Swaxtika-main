-- ============================================================
-- FINAL FIX: Admin Orders Access
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- STEP 1: Insert admin profile (handles any email case issues)
INSERT INTO public.profiles (id, email, role, is_admin, first_name)
SELECT id, email, 'admin', true, 'Swaxtika'
FROM auth.users
WHERE lower(email) = lower('Admin@swaxthika.com')
ON CONFLICT (id) DO UPDATE
  SET role = 'admin', is_admin = true;

-- STEP 2: Also try matching by any admin-looking user
-- (run this to see ALL users in your system)
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- STEP 3: Make profiles readable (needed for role checks)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- STEP 4: Create SECURITY DEFINER function to fetch ALL orders
-- This runs with postgres-level access, bypassing RLS completely
-- but only returns data if the caller is an admin
CREATE OR REPLACE FUNCTION public.get_all_orders_admin()
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  RETURN QUERY SELECT * FROM orders ORDER BY created_at DESC;
END;
$$;

-- Grant execute to authenticated users (the function itself does the auth check)
GRANT EXECUTE ON FUNCTION public.get_all_orders_admin() TO authenticated;

-- STEP 5: Also fix direct RLS on orders (belt AND suspenders)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access orders" ON orders;
DROP POLICY IF EXISTS "Customers view own orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can place orders" ON orders;
DROP POLICY IF EXISTS "Admins manage everything" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

CREATE POLICY "Admins full access"
  ON orders FOR ALL
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
    OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Customers own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers place orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- STEP 6: Enable realtime
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- ============================================================
-- VERIFICATION: Run these separately to check the fix
-- ============================================================
-- Check 1: Does admin profile exist?
SELECT id, email, role, is_admin FROM profiles WHERE is_admin = true OR role = 'admin';

-- Check 2: How many orders are in the table?
SELECT count(*) as total_orders FROM orders;

-- Check 3: See the actual order data
SELECT id, customer_name, total_amount, status, created_at FROM orders LIMIT 5;

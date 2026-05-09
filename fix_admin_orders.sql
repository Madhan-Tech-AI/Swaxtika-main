-- ============================================================
-- STEP 1: Create/Update Admin Profile
-- ============================================================
INSERT INTO public.profiles (id, email, role, is_admin, first_name)
SELECT id, email, 'admin', true, 'Swaxtika'
FROM auth.users
WHERE email = 'Admin@swaxthika.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_admin = true;

-- ============================================================
-- STEP 2: Drop ALL existing orders policies (start clean)
-- ============================================================
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'orders' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON orders';
  END LOOP;
END $$;

-- ============================================================
-- STEP 3: Enable RLS
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create correct policies
-- ============================================================

-- Admin sees ALL orders (uses is_admin column as fallback too)
CREATE POLICY "Admins full access orders"
  ON orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = true)
    )
  );

-- Customers see only their own orders
CREATE POLICY "Customers view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Allow inserts for authenticated users (for placing orders)
CREATE POLICY "Authenticated users can place orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- STEP 5: Fix order_items policies too
-- ============================================================
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'order_items' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON order_items';
  END LOOP;
END $$;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Admins see all order_items
CREATE POLICY "Admins full access order_items"
  ON order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.is_admin = true)
    )
  );

-- Customers see items from their own orders
CREATE POLICY "Customers view own order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- System can insert order_items
CREATE POLICY "System can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- STEP 6: Fix profiles policies (must be readable for role checks)
-- ============================================================
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles';
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (needed for role checks inside policies)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 7: Enable Realtime for live order notifications
-- ============================================================
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- ============================================================
-- STEP 8: VERIFY — Should return 1 admin row and count of orders
-- ============================================================
SELECT 'Admin Profile' as check_type, id, email, role, is_admin 
FROM profiles WHERE is_admin = true OR role = 'admin';

SELECT 'Order Count' as check_type, count(*)::text as value 
FROM orders;

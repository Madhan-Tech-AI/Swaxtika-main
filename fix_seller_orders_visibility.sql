-- ============================================================
-- Fix Orders Visibility for Sellers (Avoid Infinite Recursion)
-- ============================================================

-- 1. Create a Security Definer function to check if a seller can view an order.
-- Since it is SECURITY DEFINER, it bypasses RLS and prevents infinite recursion 
-- when the Orders policy queries the Order_Items table.
CREATE OR REPLACE FUNCTION public.can_seller_view_order(p_order_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_items 
    WHERE order_id = p_order_id 
    AND seller_id IN (
      SELECT id FROM public.seller_applications
      WHERE status = 'approved'
      AND (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
      )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_seller_view_order(uuid) TO authenticated;

-- 2. Add the missing policy that allows Sellers to view their own orders
DROP POLICY IF EXISTS "Sellers can view orders containing their items" ON orders;
CREATE POLICY "Sellers can view orders containing their items" ON orders FOR SELECT
  USING ( public.can_seller_view_order(id) );

-- 3. Ensure get_all_orders_admin works
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

GRANT EXECUTE ON FUNCTION public.get_all_orders_admin() TO authenticated;

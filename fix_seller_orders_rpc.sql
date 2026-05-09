-- ============================================================
-- RPC for Seller Orders
-- ============================================================

-- Create a secure RPC that sellers can call to get their orders.
-- This bypasses complex RLS joining recursion.
CREATE OR REPLACE FUNCTION public.get_seller_orders()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_result json;
BEGIN
  -- 1. Find the seller_id for the current user
  SELECT id INTO v_seller_id
  FROM public.seller_applications
  WHERE status = 'approved'
  AND (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  )
  LIMIT 1;

  IF v_seller_id IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- 2. Fetch order items and join the parent order data
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO v_result
  FROM (
    SELECT 
      oi.*,
      (
        SELECT row_to_json(o)
        FROM (
          SELECT 
            id, status, created_at, customer_name, customer_email, 
            total_amount, shipping_address
          FROM orders
          WHERE id = oi.order_id
        ) o
      ) as order
    FROM order_items oi
    WHERE oi.seller_id = v_seller_id
    ORDER BY oi.created_at DESC
  ) t;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_seller_orders() TO authenticated;

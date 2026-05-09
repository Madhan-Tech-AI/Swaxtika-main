-- ============================================================
-- RPC for Seller to Update Order Status
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_order_status_seller(p_order_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
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
    RAISE EXCEPTION 'Access denied. You are not an approved seller.';
  END IF;

  -- 2. Verify the seller actually has items in this order
  IF NOT EXISTS (
    SELECT 1 FROM order_items
    WHERE order_id = p_order_id
    AND seller_id = v_seller_id
  ) THEN
    RAISE EXCEPTION 'Access denied. You do not have any items in this order.';
  END IF;

  -- 3. Update the overall order status
  UPDATE orders
  SET status = p_status,
      updated_at = now()
  WHERE id = p_order_id;

END;
$$;

GRANT EXECUTE ON FUNCTION public.update_order_status_seller(uuid, text) TO authenticated;

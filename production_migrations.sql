-- ============================================================
-- Migration 1: Add order_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES public.seller_applications(id) ON DELETE SET NULL,
  product_name text NOT NULL,       -- snapshot at time of order
  product_image text,               -- snapshot
  price_at_time numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  line_total numeric(10,2) GENERATED ALWAYS AS (price_at_time * quantity) STORED,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX ON order_items(order_id);
CREATE INDEX ON order_items(seller_id);
CREATE INDEX ON order_items(product_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper function for seller policies (SECURE)
CREATE OR REPLACE FUNCTION public.get_my_seller_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.seller_applications
  WHERE status = 'approved'
  AND (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR user_id = auth.uid()
  );
$$;

-- Sellers see only their own order items
DROP POLICY IF EXISTS "Sellers can view own order items" ON order_items;
CREATE POLICY "Sellers can view own order items"
  ON order_items FOR SELECT
  USING (seller_id IN (SELECT get_my_seller_ids()));

-- Admins see all
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Migration 2: Fix seller_id FK on products
-- ============================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_seller_id_fkey') THEN
    ALTER TABLE products
      ADD CONSTRAINT products_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES seller_applications(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- Migration 3: Add all missing indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category, status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_deal ON products(is_deal) WHERE is_deal = true;
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_apps_email ON seller_applications(email, status);

-- ============================================================
-- Migration 4: Add Razorpay payment_id to orders
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
-- payment_status: 'pending' | 'paid' | 'failed' | 'refunded'

-- ============================================================
-- Migration 5: Fix RLS policies — remove all development open policies
-- ============================================================

-- Drop all development open policies
DROP POLICY IF EXISTS "Allow public all access on products for development" ON products;
DROP POLICY IF EXISTS "Allow public all access on orders for development" ON orders;
DROP POLICY IF EXISTS "Allow public all access on customers for development" ON customers;
DROP POLICY IF EXISTS "Allow public all access on carousel_items for development" ON carousel_items;

-- Products: public read, seller write own, admin all
DROP POLICY IF EXISTS "Anyone can read active products" ON products;
CREATE POLICY "Anyone can read active products" ON products FOR SELECT USING (status = 'Active');

DROP POLICY IF EXISTS "Sellers can view own products" ON products;
CREATE POLICY "Sellers can view own products" ON products FOR SELECT
  USING (
    seller_id IN (SELECT id FROM seller_applications WHERE email = auth.email() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Sellers can insert own products" ON products;
CREATE POLICY "Sellers can insert own products" ON products FOR INSERT
  WITH CHECK (
    seller_id IN (SELECT id FROM seller_applications WHERE email = auth.email() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Sellers can update own products" ON products;
CREATE POLICY "Sellers can update own products" ON products FOR UPDATE
  USING (
    seller_id IN (SELECT id FROM seller_applications WHERE email = auth.email() AND status = 'approved')
  );

DROP POLICY IF EXISTS "Admins can do anything to products" ON products;
CREATE POLICY "Admins can do anything to products" ON products FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Orders: users see own, admins see all, sellers see via order_items
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sellers can view orders containing their items" ON orders;
CREATE POLICY "Sellers can view orders containing their items" ON orders FOR SELECT
  USING (
    id IN (SELECT order_id FROM order_items WHERE seller_id IN (SELECT get_my_seller_ids()))
  );

DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all orders" ON orders;
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Carousel: public read, admin write
DROP POLICY IF EXISTS "Anyone can read active carousel" ON carousel_items;
CREATE POLICY "Anyone can read active carousel" ON carousel_items FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage carousel" ON carousel_items;
CREATE POLICY "Admins manage carousel" ON carousel_items FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Banners: public read, admin write
DROP POLICY IF EXISTS "Anyone can read banners" ON banners;
CREATE POLICY "Anyone can read banners" ON banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage banners" ON banners;
CREATE POLICY "Admins manage banners" ON banners FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Atomic order creation with stock decrement (DB Function)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_user_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb,
  p_item_ids uuid[],
  p_item_quantities integer[],
  p_payment_method text,
  p_razorpay_order_id text DEFAULT NULL,
  p_razorpay_payment_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_product record;
  v_subtotal numeric(10,2) := 0;
  v_shipping_fee numeric(10,2) := 0;
  v_total numeric(10,2);
  v_order_items jsonb := '[]';
  v_i integer;
BEGIN
  -- Lock all product rows to prevent race conditions (sorted to avoid deadlock)
  FOR v_product IN
    SELECT p.id, p.name, p.price, p.stock, p.image, p.seller_id
    FROM products p
    WHERE p.id = ANY(p_item_ids)
    ORDER BY p.id  -- consistent lock order prevents deadlock
    FOR UPDATE
  LOOP
    -- Find quantity for this product
    v_i := array_position(p_item_ids, v_product.id);
    
    -- Check stock
    IF v_product.stock < p_item_quantities[v_i] THEN
      RAISE EXCEPTION 'Insufficient stock for product: %. Available: %, Requested: %',
        v_product.name, v_product.stock, p_item_quantities[v_i];
    END IF;
    
    -- Decrement stock
    UPDATE products SET stock = stock - p_item_quantities[v_i] WHERE id = v_product.id;
    
    -- Accumulate subtotal
    v_subtotal := v_subtotal + (v_product.price * p_item_quantities[v_i]);
    
    -- Build JSONB items snapshot
    v_order_items := v_order_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'price', v_product.price,
        'quantity', p_item_quantities[v_i],
        'image', v_product.image
      )
    );
  END LOOP;
  
  -- Verify all products were found
  IF array_length(p_item_ids, 1) != (SELECT COUNT(*) FROM products WHERE id = ANY(p_item_ids)) THEN
    RAISE EXCEPTION 'One or more products not found';
  END IF;
  
  -- Calculate shipping
  v_shipping_fee := CASE WHEN v_subtotal >= 1000 THEN 0 ELSE 150 END;
  v_total := v_subtotal + v_shipping_fee;
  
  -- Create order
  INSERT INTO orders (
    user_id, customer_name, customer_email, customer_phone,
    shipping_address, items, subtotal, shipping_fee, total_amount,
    payment_method, payment_status, status,
    razorpay_order_id, razorpay_payment_id
  ) VALUES (
    p_user_id, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, v_order_items, v_subtotal, v_shipping_fee, v_total,
    p_payment_method,
    CASE WHEN p_payment_method = 'cod' THEN 'pending' ELSE 'paid' END,
    'Pending',
    p_razorpay_order_id, p_razorpay_payment_id
  ) RETURNING id INTO v_order_id;
  
  -- Create normalised order_items rows
  FOR v_i IN 1..array_length(p_item_ids, 1)
  LOOP
    INSERT INTO order_items (order_id, product_id, seller_id, product_name, product_image, price_at_time, quantity)
    SELECT
      v_order_id,
      p.id,
      p.seller_id,
      p.name,
      p.image,
      p.price,
      p_item_quantities[v_i]
    FROM products p WHERE p.id = p_item_ids[v_i];
  END LOOP;
  
  -- Clear the user's cart
  DELETE FROM cart_items WHERE user_id = p_user_id;
  
  RETURN v_order_id;
END;
$$;

-- Grant execute to authenticated users (called via service role in Edge Function)
GRANT EXECUTE ON FUNCTION create_order_atomic TO service_role;

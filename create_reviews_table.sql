-- ============================================================
-- CREATE: product_reviews table for real-time customer reviews
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.product_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can read reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.product_reviews;
CREATE POLICY "Anyone can read reviews"
  ON public.product_reviews FOR SELECT
  USING (true);

-- 2. Authenticated users can insert their own reviews
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.product_reviews;
CREATE POLICY "Users can insert own reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own reviews
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Users can update own reviews"
  ON public.product_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Users can delete their own reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.product_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Admins can manage all reviews
DROP POLICY IF EXISTS "Admins manage all reviews" ON public.product_reviews;
CREATE POLICY "Admins manage all reviews"
  ON public.product_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_reviews;

-- Reload schema
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! The product_reviews table is ready.
-- ============================================================

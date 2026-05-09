-- Add new store customization fields to seller_applications
ALTER TABLE public.seller_applications
ADD COLUMN IF NOT EXISTS store_description TEXT,
ADD COLUMN IF NOT EXISTS store_website TEXT,
ADD COLUMN IF NOT EXISTS store_logo TEXT,
ADD COLUMN IF NOT EXISTS store_banner TEXT;

-- Grant permissions if needed
GRANT ALL ON public.seller_applications TO authenticated;
GRANT ALL ON public.seller_applications TO anon;
GRANT ALL ON public.seller_applications TO service_role;

-- Create Banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    image_url TEXT NOT NULL,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on banners"
    ON public.banners FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for authenticated users on banners"
    ON public.banners FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users on banners"
    ON public.banners FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users on banners"
    ON public.banners FOR DELETE
    USING (auth.role() = 'authenticated');


-- Create Seller Applications table
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    gst_number TEXT,
    pan_number TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Set up RLS for seller_applications
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (anon)
CREATE POLICY "Enable insert access for anon users on seller_applications"
    ON public.seller_applications FOR INSERT
    WITH CHECK (true);

-- Only authenticated admins can read/update applications
CREATE POLICY "Enable read access for authenticated users on seller_applications"
    ON public.seller_applications FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users on seller_applications"
    ON public.seller_applications FOR UPDATE
    USING (auth.role() = 'authenticated');

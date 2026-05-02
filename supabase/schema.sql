-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Create Tables
-- ==========================================

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deities Table
CREATE TABLE IF NOT EXISTS public.deities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    brand TEXT,
    sku TEXT UNIQUE,
    description TEXT,
    bullet_points JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    stock INTEGER DEFAULT 0,
    rating NUMERIC DEFAULT 5.0,
    reviews INTEGER DEFAULT 0,
    image TEXT,
    additional_images JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    is_deal BOOLEAN DEFAULT false,
    claimed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id),
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carousel Items Table
CREATE TABLE IF NOT EXISTS public.carousel_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT, -- For 'Hot Deal', 'Today''s Deal', etc.
    image_url TEXT NOT NULL,
    link_url TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Set Row Level Security (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public read access to everyone for development)
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on deities" ON public.deities;
CREATE POLICY "Allow public read access on deities" ON public.deities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on customers" ON public.customers;
CREATE POLICY "Allow public read access on customers" ON public.customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
CREATE POLICY "Allow public read access on orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on carousel_items" ON public.carousel_items;
CREATE POLICY "Allow public read access on carousel_items" ON public.carousel_items FOR SELECT USING (true);

-- (In a real app, you would add authentication policies for INSERT/UPDATE/DELETE here)
DROP POLICY IF EXISTS "Allow public all access on products for development" ON public.products;
CREATE POLICY "Allow public all access on products for development" ON public.products FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all access on orders for development" ON public.orders;
CREATE POLICY "Allow public all access on orders for development" ON public.orders FOR ALL USING (true);

-- ==========================================
-- STORAGE SETUP INSTRUCTIONS (RUN IN SQL EDITOR)
-- ==========================================
-- 1. Create a public bucket named 'carousel-images'
-- INSERT INTO storage.buckets (id, name, public) VALUES ('carousel-images', 'carousel-images', true);

-- 2. Allow public access to read images
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'carousel-images' );

-- 3. Allow public access to upload images (for development)
-- CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'carousel-images' );

DROP POLICY IF EXISTS "Allow public all access on customers for development" ON public.customers;
CREATE POLICY "Allow public all access on customers for development" ON public.customers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all access on carousel_items for development" ON public.carousel_items;
CREATE POLICY "Allow public all access on carousel_items for development" ON public.carousel_items FOR ALL USING (true);




-- Create featured_banners table for dynamic home page layouts
CREATE TABLE IF NOT EXISTS featured_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_name TEXT NOT NULL UNIQUE, -- e.g., 'main_featured_large', 'side_top', 'side_middle', 'side_bottom', 'wide_bottom'
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Policies
ALTER TABLE featured_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON featured_banners FOR SELECT USING (true);
CREATE POLICY "Allow full access for admin" ON featured_banners FOR ALL USING (
  auth.role() = 'authenticated' AND 
  (auth.jwt() ->> 'role' = 'admin' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
) WITH CHECK (
  auth.role() = 'authenticated' AND 
  (auth.jwt() ->> 'role' = 'admin' OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
);

-- Insert initial slots (as placeholders)
INSERT INTO featured_banners (slot_name, title, subtitle) VALUES
('main_featured_large', 'Idols & Handicrafts', 'Top Selling'),
('side_top', 'Giri Books & Other Books', 'Books'),
('side_middle', 'Homam & Puja Items', 'Homam'),
('side_bottom', 'Puja Lamps & Electric Lamps', 'Lamps'),
('wide_bottom', 'Yantram Collections', 'Yantram')
ON CONFLICT (slot_name) DO NOTHING;

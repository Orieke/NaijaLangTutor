-- ============================================
-- ASSET CATEGORIES TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Create categories table
CREATE TABLE IF NOT EXISTS asset_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- For storing emoji or icon name
    color VARCHAR(20), -- For UI color coding
    status asset_status DEFAULT 'pending',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_categories_status ON asset_categories(status);
CREATE INDEX idx_categories_name ON asset_categories(name);

-- Enable RLS
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories

-- SELECT: Everyone can see approved categories, creators see their own, admins see all
CREATE POLICY "categories_select" ON asset_categories
    FOR SELECT
    TO authenticated
    USING (
        status = 'approved'
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- INSERT: Contributors, reviewers, and admins can create categories
CREATE POLICY "categories_insert" ON asset_categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('contributor', 'reviewer', 'admin')
        )
    );

-- UPDATE: Only admins can update categories (for approval)
CREATE POLICY "categories_update" ON asset_categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- DELETE: Only admins can delete categories
CREATE POLICY "categories_delete" ON asset_categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert default approved categories
INSERT INTO asset_categories (name, description, icon, status, created_by, approved_by, approved_at) VALUES
    ('greetings', 'Common greetings and salutations', '👋', 'approved', NULL, NULL, NOW()),
    ('family', 'Family relationships and terms', '👨‍👩‍👧‍👦', 'approved', NULL, NULL, NOW()),
    ('food', 'Food, cooking, and eating', '🍲', 'approved', NULL, NULL, NOW()),
    ('numbers', 'Numbers and counting', '🔢', 'approved', NULL, NULL, NOW()),
    ('colors', 'Colors and descriptions', '🎨', 'approved', NULL, NULL, NOW()),
    ('animals', 'Animals and wildlife', '🦁', 'approved', NULL, NULL, NOW()),
    ('nature', 'Nature and environment', '🌳', 'approved', NULL, NULL, NOW()),
    ('body', 'Body parts and health', '🫀', 'approved', NULL, NULL, NOW()),
    ('time', 'Time, days, and calendar', '⏰', 'approved', NULL, NULL, NOW()),
    ('market', 'Market, commerce, and trade', '🛒', 'approved', NULL, NULL, NOW()),
    ('culture', 'Culture and traditions', '🎭', 'approved', NULL, NULL, NOW()),
    ('proverbs', 'Proverbs and wisdom sayings', '📜', 'approved', NULL, NULL, NOW())
ON CONFLICT (name) DO NOTHING;

-- Verify categories
SELECT name, status, icon FROM asset_categories ORDER BY name;

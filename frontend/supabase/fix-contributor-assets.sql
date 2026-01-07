-- ============================================
-- FIX CONTRIBUTOR ASSET CREATION
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check existing policies
SELECT policyname, cmd, permissive, qual, with_check 
FROM pg_policies 
WHERE tablename = 'assets';

-- ========================================
-- STEP 1: Drop existing asset policies
-- ========================================
DROP POLICY IF EXISTS "Approved assets are viewable" ON assets;
DROP POLICY IF EXISTS "Users can create assets" ON assets;
DROP POLICY IF EXISTS "Users can update own draft assets" ON assets;
DROP POLICY IF EXISTS "Reviewers can update asset status" ON assets;
DROP POLICY IF EXISTS "assets_select_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;

-- ========================================
-- STEP 2: Create proper policies
-- ========================================

-- SELECT: Users can see approved assets OR their own assets, admins/reviewers see all
CREATE POLICY "assets_select" ON assets
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

-- INSERT: Contributors, reviewers, and admins can create assets
-- The created_by must match auth.uid()
CREATE POLICY "assets_insert" ON assets
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

-- UPDATE: Users can update their own assets (any status)
-- Reviewers/admins can update any asset
CREATE POLICY "assets_update_own" ON assets
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "assets_update_reviewer" ON assets
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('reviewer', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- DELETE: Only admins can delete assets
CREATE POLICY "assets_delete" ON assets
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ========================================
-- STEP 3: Verify policies
-- ========================================
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'assets'
ORDER BY cmd;

-- ========================================
-- STEP 4: Test - Check your current role
-- ========================================
SELECT id, display_name, role FROM profiles WHERE id = auth.uid();

-- ========================================
-- STEP 5: Verify assets table structure
-- ========================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'assets'
ORDER BY ordinal_position;

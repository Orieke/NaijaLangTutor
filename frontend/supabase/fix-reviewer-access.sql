-- Fix RLS policies for reviewer access to assets table
-- Run this ENTIRE script in Supabase SQL Editor (copy and paste all of it)

-- ========================================
-- STEP 1: Check current data
-- ========================================
SELECT COUNT(*) as total_assets FROM assets;
SELECT status, COUNT(*) as count FROM assets GROUP BY status;

-- ========================================
-- STEP 2: Drop ALL existing policies on assets
-- ========================================
DROP POLICY IF EXISTS "Users can view approved assets" ON assets;
DROP POLICY IF EXISTS "Contributors can create assets" ON assets;
DROP POLICY IF EXISTS "Contributors can view own assets" ON assets;
DROP POLICY IF EXISTS "Reviewers can view all assets" ON assets;
DROP POLICY IF EXISTS "Reviewers can update asset status" ON assets;
DROP POLICY IF EXISTS "Anyone can view approved assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can view assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can view pending assets" ON assets;
DROP POLICY IF EXISTS "Contributors can update own drafts" ON assets;
DROP POLICY IF EXISTS "Admins can delete assets" ON assets;
DROP POLICY IF EXISTS "assets_select_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;

-- ========================================
-- STEP 3: Create SIMPLE, PERMISSIVE policies
-- ========================================

-- SINGLE SELECT policy that handles all cases
CREATE POLICY "assets_select_policy" ON assets
    FOR SELECT
    TO authenticated
    USING (
        -- Approved assets: everyone can see
        status = 'approved'
        -- Own assets: creators can see all their own
        OR created_by = auth.uid()
        -- Reviewers/Admins can see ALL assets (including pending)
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- INSERT policy for contributors+
CREATE POLICY "assets_insert_policy" ON assets
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('contributor', 'reviewer', 'admin')
        )
    );

-- UPDATE policy - contributors can update own, reviewers can update any
CREATE POLICY "assets_update_policy" ON assets
    FOR UPDATE
    TO authenticated
    USING (
        -- Own assets
        created_by = auth.uid()
        -- OR reviewer/admin
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('reviewer', 'admin')
        )
    )
    WITH CHECK (
        -- Own assets
        created_by = auth.uid()
        -- OR reviewer/admin
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- DELETE policy for admins only
CREATE POLICY "assets_delete_policy" ON assets
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
-- STEP 4: Verify policies were created
-- ========================================
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'assets';

-- ========================================
-- STEP 5: Test the setup - Check your role
-- ========================================
SELECT id, display_name, role FROM profiles WHERE id = auth.uid();

-- ========================================
-- STEP 6: Create test data if no pending assets exist
-- ========================================
-- Run this ONLY if you have no pending assets to test with
-- First check:
SELECT COUNT(*) as pending_count FROM assets WHERE status = 'pending';

-- If pending_count is 0, run this to create test data:
INSERT INTO assets (igbo_text, english_text, type, status, difficulty, category, created_by)
SELECT 
    'Nnọọ' as igbo_text,
    'Welcome' as english_text,
    'word' as type,
    'pending' as status,
    'beginner' as difficulty,
    'greetings' as category,
    (SELECT id FROM profiles WHERE role IN ('contributor', 'admin') LIMIT 1) as created_by
WHERE NOT EXISTS (SELECT 1 FROM assets WHERE status = 'pending');

INSERT INTO assets (igbo_text, english_text, type, status, difficulty, category, created_by)
SELECT 
    'Kedụ ka ị mere?' as igbo_text,
    'How are you?' as english_text,
    'phrase' as type,
    'pending' as status,
    'beginner' as difficulty,
    'greetings' as category,
    (SELECT id FROM profiles WHERE role IN ('contributor', 'admin') LIMIT 1) as created_by
WHERE (SELECT COUNT(*) FROM assets WHERE status = 'pending') < 2;

INSERT INTO assets (igbo_text, english_text, type, status, difficulty, category, created_by)
SELECT 
    'Daalu' as igbo_text,
    'Thank you' as english_text,
    'word' as type,
    'pending' as status,
    'beginner' as difficulty,
    'common' as category,
    (SELECT id FROM profiles WHERE role IN ('contributor', 'admin') LIMIT 1) as created_by
WHERE (SELECT COUNT(*) FROM assets WHERE status = 'pending') < 3;

-- ========================================
-- STEP 7: Final verification
-- ========================================
SELECT status, COUNT(*) as count FROM assets GROUP BY status;
SELECT * FROM assets WHERE status = 'pending' LIMIT 5;

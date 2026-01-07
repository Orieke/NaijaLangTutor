-- RESTORE ORIGINAL RLS POLICIES
-- Run this in Supabase SQL Editor to undo fix-reviewer-access.sql changes

-- ========================================
-- STEP 1: Drop ALL policies on assets (both new and original)
-- ========================================
DROP POLICY IF EXISTS "assets_select_policy" ON assets;
DROP POLICY IF EXISTS "assets_insert_policy" ON assets;
DROP POLICY IF EXISTS "assets_update_policy" ON assets;
DROP POLICY IF EXISTS "assets_delete_policy" ON assets;
DROP POLICY IF EXISTS "Anyone can view approved assets" ON assets;
DROP POLICY IF EXISTS "Authenticated users can view pending assets" ON assets;
DROP POLICY IF EXISTS "Contributors can create assets" ON assets;
DROP POLICY IF EXISTS "Contributors can update own drafts" ON assets;
DROP POLICY IF EXISTS "Reviewers can update asset status" ON assets;
DROP POLICY IF EXISTS "Admins can delete assets" ON assets;
-- Also drop the original policies (in case they exist)
DROP POLICY IF EXISTS "Approved assets are viewable" ON assets;
DROP POLICY IF EXISTS "Users can create assets" ON assets;
DROP POLICY IF EXISTS "Users can update own draft assets" ON assets;

-- ========================================
-- STEP 2: Restore ORIGINAL policies from schema.sql
-- ========================================

-- Original: Approved assets are viewable
CREATE POLICY "Approved assets are viewable" ON assets
    FOR SELECT USING (status = 'approved' OR created_by = auth.uid());

-- Original: Users can create assets
CREATE POLICY "Users can create assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Original: Users can update own draft assets
CREATE POLICY "Users can update own draft assets" ON assets
    FOR UPDATE USING (created_by = auth.uid() AND status = 'draft');

-- Original: Reviewers can update asset status
CREATE POLICY "Reviewers can update asset status" ON assets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('reviewer', 'admin'))
    );

-- ========================================
-- STEP 3: Verify policies are restored
-- ========================================
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'assets';

-- ========================================
-- STEP 4: Verify data is still accessible
-- ========================================
SELECT status, COUNT(*) as count FROM assets GROUP BY status;

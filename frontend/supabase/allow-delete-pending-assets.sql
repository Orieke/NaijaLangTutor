-- ============================================
-- ALLOW CONTRIBUTORS TO DELETE PENDING/DRAFT ASSETS
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing delete policy
DROP POLICY IF EXISTS "assets_delete" ON assets;

-- CREATE NEW DELETE POLICY:
-- 1. Contributors can delete their own assets if status is 'draft' or 'pending'
-- 2. Admins can delete any asset
CREATE POLICY "assets_delete" ON assets
    FOR DELETE
    TO authenticated
    USING (
        -- Contributors can delete their own draft/pending assets
        (
            created_by = auth.uid() 
            AND status IN ('draft', 'pending')
        )
        OR
        -- Admins can delete any asset
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verify the policy was created
SELECT policyname, cmd, permissive, qual
FROM pg_policies 
WHERE tablename = 'assets' AND cmd = 'DELETE';

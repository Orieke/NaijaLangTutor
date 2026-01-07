-- ============================================
-- FIX AUDIO UPLOAD - Storage & Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- ========================================
-- STEP 1: Check if storage bucket exists
-- ========================================
SELECT * FROM storage.buckets WHERE id = 'audio';

-- ========================================
-- STEP 2: Create audio bucket if it doesn't exist
-- ========================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio',
    'audio',
    TRUE,
    10485760, -- 10MB limit
    ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav'];

-- ========================================
-- STEP 3: Drop existing storage policies for audio bucket
-- ========================================
DROP POLICY IF EXISTS "Public audio access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;
DROP POLICY IF EXISTS "audio_select" ON storage.objects;
DROP POLICY IF EXISTS "audio_insert" ON storage.objects;
DROP POLICY IF EXISTS "audio_update" ON storage.objects;
DROP POLICY IF EXISTS "audio_delete" ON storage.objects;

-- ========================================
-- STEP 4: Create new storage policies for audio bucket
-- ========================================

-- Anyone can view audio files (public bucket)
CREATE POLICY "audio_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'audio');

-- Authenticated users can upload audio to their own folder
CREATE POLICY "audio_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'audio'
        AND auth.role() = 'authenticated'
    );

-- Users can update their own audio files
CREATE POLICY "audio_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own audio files
CREATE POLICY "audio_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'audio'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ========================================
-- STEP 5: Check audio_submissions table and policies
-- ========================================
SELECT * FROM information_schema.tables WHERE table_name = 'audio_submissions';

-- Check existing policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'audio_submissions';

-- ========================================
-- STEP 6: Fix audio_submissions RLS policies
-- ========================================
DROP POLICY IF EXISTS "Approved audio is viewable" ON audio_submissions;
DROP POLICY IF EXISTS "Users can submit audio" ON audio_submissions;
DROP POLICY IF EXISTS "Reviewers can update audio status" ON audio_submissions;
DROP POLICY IF EXISTS "audio_submissions_select" ON audio_submissions;
DROP POLICY IF EXISTS "audio_submissions_insert" ON audio_submissions;
DROP POLICY IF EXISTS "audio_submissions_update" ON audio_submissions;

-- SELECT: Users can see approved audio or their own submissions
CREATE POLICY "audio_submissions_select" ON audio_submissions
    FOR SELECT
    TO authenticated
    USING (
        status = 'approved'
        OR submitted_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- INSERT: Authenticated users can submit audio
CREATE POLICY "audio_submissions_insert" ON audio_submissions
    FOR INSERT
    TO authenticated
    WITH CHECK (submitted_by = auth.uid());

-- UPDATE: Users can update own pending submissions, reviewers can update any
CREATE POLICY "audio_submissions_update" ON audio_submissions
    FOR UPDATE
    TO authenticated
    USING (
        (submitted_by = auth.uid() AND status = 'pending')
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- ========================================
-- STEP 7: Verify everything is set up
-- ========================================
SELECT 'Storage Buckets:' as info;
SELECT id, name, public FROM storage.buckets WHERE id = 'audio';

SELECT 'Storage Policies:' as info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

SELECT 'Audio Submissions Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'audio_submissions';

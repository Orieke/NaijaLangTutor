-- ============================================
-- FEEDBACK TABLE - User feedback and feature requests
-- Run this in Supabase SQL Editor
-- ============================================

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('feedback', 'feature', 'bug', 'other')),
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in-progress', 'resolved', 'closed')),
    admin_notes TEXT,
    user_agent TEXT,
    app_version VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON feedback;

-- INSERT: Anyone can submit feedback (even anonymous)
CREATE POLICY "Anyone can submit feedback" ON feedback
    FOR INSERT
    WITH CHECK (true);

-- SELECT: Users can see their own feedback, admins can see all
CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- UPDATE: Only admins can update feedback (to change status, add notes)
CREATE POLICY "Admins can update feedback" ON feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_feedback_updated_at ON feedback;
CREATE TRIGGER trigger_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Verify setup
SELECT 'Feedback table created:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'feedback';

SELECT 'Feedback policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'feedback';

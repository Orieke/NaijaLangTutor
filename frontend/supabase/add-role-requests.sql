-- ============================================
-- ROLE REQUESTS TABLE
-- For learners to request contributor access
-- ============================================

-- Create request status enum (skip if exists)
DO $$ BEGIN
    CREATE TYPE role_request_status AS ENUM ('pending', 'approved', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop table if exists to recreate with correct policies
DROP TABLE IF EXISTS role_requests CASCADE;

-- Create the role_requests table
CREATE TABLE role_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role user_role NOT NULL DEFAULT 'contributor',
    reason TEXT NOT NULL,
    status role_request_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_role_requests_user ON role_requests(user_id);
CREATE INDEX idx_role_requests_status ON role_requests(status);
CREATE INDEX idx_role_requests_created ON role_requests(created_at);

-- Create unique index to prevent duplicate pending requests (instead of table constraint)
CREATE UNIQUE INDEX idx_unique_pending_request 
ON role_requests(user_id, requested_role) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE role_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SIMPLE RLS POLICIES (avoiding recursion)
-- ============================================

-- Users can view their own requests
CREATE POLICY "users_select_own_requests" ON role_requests
    FOR SELECT 
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "admins_select_all_requests" ON role_requests
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Users can insert their own requests (simple check, uniqueness enforced by index)
CREATE POLICY "users_insert_requests" ON role_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can update any request
CREATE POLICY "admins_update_requests" ON role_requests
    FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- ============================================
-- FUNCTION: Approve role request and update user role
-- ============================================

DROP FUNCTION IF EXISTS approve_role_request(UUID, TEXT);

CREATE OR REPLACE FUNCTION approve_role_request(request_id UUID, admin_notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    req_user_id UUID;
    req_role user_role;
    caller_role user_role;
    result JSONB;
BEGIN
    -- Get caller's role
    SELECT role INTO caller_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    IF caller_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only admins can approve requests');
    END IF;

    -- Get the request details
    SELECT user_id, requested_role INTO req_user_id, req_role
    FROM role_requests
    WHERE id = request_id AND status = 'pending';
    
    IF req_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
    END IF;
    
    -- Update the request status
    UPDATE role_requests
    SET status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = NOW(),
        review_notes = admin_notes,
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Update the user's role
    UPDATE profiles
    SET role = req_role,
        updated_at = NOW()
    WHERE id = req_user_id;
    
    RETURN jsonb_build_object('success', true, 'user_id', req_user_id, 'new_role', req_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Decline role request
-- ============================================

DROP FUNCTION IF EXISTS decline_role_request(UUID, TEXT);

CREATE OR REPLACE FUNCTION decline_role_request(request_id UUID, admin_notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    caller_role user_role;
    updated_count INTEGER;
BEGIN
    -- Get caller's role
    SELECT role INTO caller_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    IF caller_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only admins can decline requests');
    END IF;

    UPDATE role_requests
    SET status = 'declined',
        reviewed_by = auth.uid(),
        reviewed_at = NOW(),
        review_notes = admin_notes,
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_role_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_role_request(UUID, TEXT) TO authenticated;

-- ============================================
-- Verify the table was created
-- ============================================
SELECT * FROM role_requests LIMIT 1;

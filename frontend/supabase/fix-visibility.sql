-- Run this in Supabase SQL Editor to make your sample data visible
-- This will update assets and lessons to be visible in the app

-- Update all assets to be approved (so they show in the Learn page)
UPDATE assets 
SET status = 'approved' 
WHERE status != 'approved';

-- Update all lessons to be published (so they show in the Learn page)
UPDATE lessons 
SET is_published = TRUE 
WHERE is_published = FALSE;

-- Verify the updates
SELECT 'Assets' as table_name, status, COUNT(*) as count 
FROM assets 
GROUP BY status;

SELECT 'Lessons' as table_name, is_published, COUNT(*) as count 
FROM lessons 
GROUP BY is_published;

-- Show what data is now available
SELECT id, igbo_text, english_text, status, audio_url 
FROM assets 
ORDER BY created_at DESC 
LIMIT 10;

SELECT id, title, description, is_published, order_index 
FROM lessons 
ORDER BY order_index 
LIMIT 10;

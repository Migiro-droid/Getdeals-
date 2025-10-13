-- Fix customer_id format - Remove auto-generated customer IDs that don't match Rukisha format
-- Rukisha customer IDs are numeric strings like "7892", "12345", etc.
-- Our system was incorrectly generating "customer_<uuid>" format

-- IMPORTANT: Run this after backing up your database!

-- Step 1: Show current invalid customer_ids (for review)
SELECT 
  id,
  email,
  customer_id,
  first_name,
  last_name,
  created_at
FROM profiles
WHERE customer_id IS NOT NULL 
  AND customer_id LIKE 'customer_%'
ORDER BY created_at DESC;

-- Step 2: Clear invalid customer_ids (uncomment to execute)
-- UPDATE profiles
-- SET customer_id = NULL
-- WHERE customer_id LIKE 'customer_%';

-- Step 3: Verify the fix
-- SELECT 
--   COUNT(*) as total_profiles,
--   COUNT(customer_id) as profiles_with_customer_id,
--   COUNT(CASE WHEN customer_id LIKE 'customer_%' THEN 1 END) as invalid_format,
--   COUNT(CASE WHEN customer_id ~ '^[0-9]+$' THEN 1 END) as valid_rukisha_format
-- FROM profiles;

-- Note: Users will need to complete KYC registration again to get a proper Rukisha customer_id
-- This is necessary for deposits and payments to work correctly

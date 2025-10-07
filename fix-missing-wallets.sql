-- Quick fix: Check and create wallets for users who don't have one
-- Date: October 7, 2025

-- Check which users don't have wallets
SELECT 
  up.user_id,
  up.full_name,
  up.email,
  up.phone
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id
WHERE w.user_id IS NULL;

-- Create wallets for all users who don't have one
INSERT INTO wallets (user_id, balance)
SELECT 
  up.user_id,
  0 as balance
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify all users now have wallets
SELECT 
  COUNT(*) as total_users,
  COUNT(w.user_id) as users_with_wallets,
  COUNT(*) - COUNT(w.user_id) as users_without_wallets
FROM user_profile up
LEFT JOIN wallets w ON up.user_id = w.user_id;

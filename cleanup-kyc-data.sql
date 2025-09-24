-- Script to remove KYC data for Eric Ndivo Muoki and Greg Muoki
-- This will clean up the wallet_kyc table and related profile data

-- First, let's see what data exists for these users
SELECT 
    p.id as profile_id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.phone,
    p.customer_id,
    wk.id as kyc_id,
    wk.full_name,
    wk.phone_number,
    wk.id_number,
    wk.status
FROM profiles p
LEFT JOIN wallet_kyc wk ON p.user_id = wk.user_id
WHERE 
    LOWER(p.first_name || ' ' || COALESCE(p.last_name, '')) LIKE '%eric%ndivo%'
    OR LOWER(p.first_name || ' ' || COALESCE(p.last_name, '')) LIKE '%greg%muoki%'
    OR LOWER(wk.full_name) LIKE '%eric%ndivo%'
    OR LOWER(wk.full_name) LIKE '%greg%muoki%';

-- Delete KYC data for Eric Ndivo Muoki
DELETE FROM wallet_kyc 
WHERE 
    LOWER(full_name) LIKE '%eric%ndivo%muoki%'
    OR LOWER(full_name) LIKE '%eric ndivo muoki%'
    OR LOWER(full_name) LIKE '%eric%muoki%'
    OR id_number IN (
        SELECT id_number FROM wallet_kyc 
        WHERE LOWER(full_name) LIKE '%eric%'
    );

-- Delete KYC data for Greg Muoki
DELETE FROM wallet_kyc 
WHERE 
    LOWER(full_name) LIKE '%greg%muoki%'
    OR LOWER(full_name) LIKE '%gregory%muoki%';

-- Reset customer_id in profiles for these users
UPDATE profiles 
SET 
    customer_id = NULL,
    updated_at = NOW()
WHERE 
    LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE '%eric%ndivo%'
    OR LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE '%greg%muoki%'
    OR user_id IN (
        SELECT DISTINCT user_id FROM wallet_kyc 
        WHERE LOWER(full_name) LIKE '%eric%' 
           OR LOWER(full_name) LIKE '%greg%muoki%'
    );

-- Also deactivate wallets for these users to force re-activation
UPDATE wallets 
SET 
    is_active = false,
    updated_at = NOW()
WHERE user_id IN (
    SELECT user_id FROM profiles 
    WHERE 
        LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE '%eric%ndivo%'
        OR LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE '%greg%muoki%'
);

-- Optional: Remove wallet transactions for these users (uncomment if needed)
-- DELETE FROM wallet_transactions 
-- WHERE user_id IN (
--     SELECT user_id FROM profiles 
--     WHERE 
--         LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE '%eric%ndivo%'
--         OR LOWER(first_name || ' ' || COALESCE(last_name, '')) LIKE '%greg%muoki%'
-- );

-- Verify the cleanup
SELECT 
    'After cleanup - Remaining KYC records' as status,
    COUNT(*) as count
FROM wallet_kyc;

SELECT 
    'After cleanup - Profiles with customer_id' as status,
    COUNT(*) as count
FROM profiles 
WHERE customer_id IS NOT NULL;

-- Show any remaining records that might match these names
SELECT 
    p.first_name,
    p.last_name,
    p.phone,
    p.customer_id,
    wk.full_name,
    wk.status
FROM profiles p
LEFT JOIN wallet_kyc wk ON p.user_id = wk.user_id
WHERE 
    LOWER(p.first_name || ' ' || COALESCE(p.last_name, '')) LIKE '%eric%'
    OR LOWER(p.first_name || ' ' || COALESCE(p.last_name, '')) LIKE '%greg%'
    OR LOWER(wk.full_name) LIKE '%eric%'
    OR LOWER(wk.full_name) LIKE '%greg%';
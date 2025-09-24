-- Fix Existing KYC Records and Profiles for Immediate Wallet Access
-- Run this in Supabase Dashboard → SQL Editor

-- First, temporarily disable the problematic trigger
DROP TRIGGER IF EXISTS update_updated_at_trigger ON profiles;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON wallet_kyc;
DROP TRIGGER IF EXISTS update_updated_at_trigger ON wallets;

-- Fix the trigger function to use correct column name
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Update all pending KYC records to verified status
UPDATE wallet_kyc 
SET 
  status = 'verified',
  verified_at = NOW(),
  updated_at = NOW()
WHERE status = 'pending_verification';

-- 2. Ensure all users with KYC data have customer_id in profiles
UPDATE profiles 
SET 
  customer_id = CASE 
    WHEN customer_id IS NULL OR customer_id = '' 
    THEN 'customer_' || user_id::text 
    ELSE customer_id 
  END,
  updated_at = NOW()
WHERE user_id IN (
  SELECT user_id FROM wallet_kyc WHERE status = 'verified'
);

-- 3. Activate wallets for verified users
INSERT INTO wallets (user_id, balance, is_active, created_at, updated_at)
SELECT 
  wk.user_id,
  0 as balance,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM wallet_kyc wk
WHERE wk.status = 'verified'
  AND NOT EXISTS (
    SELECT 1 FROM wallets w WHERE w.user_id = wk.user_id
  );

-- Update existing wallets to be active
UPDATE wallets 
SET is_active = true, updated_at = NOW()
WHERE user_id IN (
  SELECT user_id FROM wallet_kyc WHERE status = 'verified'
);

-- 4. Check the results
SELECT 
  'KYC Records' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count
FROM wallet_kyc

UNION ALL

SELECT 
  'Profiles with customer_id' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as with_customer_id
FROM profiles

UNION ALL

SELECT 
  'Active Wallets' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM wallets;

-- Recreate the triggers with correct function
CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON wallet_kyc
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_updated_at_trigger
    BEFORE UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
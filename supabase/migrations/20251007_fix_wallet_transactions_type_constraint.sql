-- Fix wallet_transactions type constraint to allow 'payment' type
-- Date: October 7, 2025

-- Drop old constraint if exists
ALTER TABLE wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

-- Add new constraint that includes 'payment' type
ALTER TABLE wallet_transactions 
ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type IN ('deposit', 'withdrawal', 'payment'));

-- Add comment
COMMENT ON CONSTRAINT wallet_transactions_type_check ON wallet_transactions 
IS 'Allowed transaction types: deposit (funds added), withdrawal (funds removed), payment (wallet-to-merchant payment)';

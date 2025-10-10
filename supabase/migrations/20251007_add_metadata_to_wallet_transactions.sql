-- Migration to add metadata column to wallet_transactions for storing additional payment details
-- Date: October 7, 2025
-- Purpose: Store Rukisha API responses, callback data, and merchant payment details

-- Add metadata column to store JSON data
ALTER TABLE wallet_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_metadata 
ON wallet_transactions USING GIN (metadata);

-- Add status 'processing' to the constraint if it doesn't exist
ALTER TABLE wallet_transactions 
DROP CONSTRAINT IF EXISTS chk_status;

ALTER TABLE wallet_transactions 
ADD CONSTRAINT chk_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

-- Add comment to metadata column
COMMENT ON COLUMN wallet_transactions.metadata IS 'Stores additional payment details including Rukisha API responses, merchant IDs, callback data, etc.';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS wallet_transactions_updated_at ON wallet_transactions;
CREATE TRIGGER wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_transaction_timestamp();

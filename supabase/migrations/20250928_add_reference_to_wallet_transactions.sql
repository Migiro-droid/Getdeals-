-- Migration to add reference column and other missing fields to wallet_transactions table
-- This enables proper tracking of Rukisha deposit transactions

-- Add reference column for tracking Rukisha callback references
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference TEXT;

-- Add transaction_id column for storing Rukisha transaction IDs
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- Add status column if it doesn't exist
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add phone_number column for tracking the phone number used
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add user_id column if it doesn't exist (should be there but let's ensure)
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add completed_at timestamp for tracking when transaction completed
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add updated_at timestamp
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_transaction_id ON wallet_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_status ON wallet_transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- Update existing records to have proper timestamps if they're missing
UPDATE wallet_transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add constraints
ALTER TABLE wallet_transactions ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));
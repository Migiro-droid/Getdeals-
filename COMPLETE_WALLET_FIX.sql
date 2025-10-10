-- COMPLETE WALLET BALANCE FIX
-- Run this entire script in Supabase SQL Editor
-- This will create the necessary functions and trigger for automatic balance sync

-- ==========================================
-- STEP 1: Create Balance Calculation Functions
-- ==========================================

-- Function to calculate wallet balance from completed transactions only
CREATE OR REPLACE FUNCTION calculate_wallet_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total_balance NUMERIC := 0;
BEGIN
  -- Calculate balance from completed transactions only
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'deposit' AND status = 'completed' THEN amount
      WHEN type = 'withdrawal' AND status = 'completed' THEN -amount
      WHEN type = 'payment' AND status = 'completed' THEN -amount
      ELSE 0
    END
  ), 0) INTO total_balance
  FROM wallet_transactions
  WHERE user_id = p_user_id;
  
  RETURN total_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync wallet balance based on completed transactions
CREATE OR REPLACE FUNCTION sync_wallet_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  calculated_balance NUMERIC;
BEGIN  
  -- Calculate the correct balance
  calculated_balance := calculate_wallet_balance(p_user_id);
  
  -- Update the wallet with the calculated balance
  UPDATE wallets 
  SET 
    balance = calculated_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Return the calculated balance
  RETURN calculated_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- STEP 2: Create Automatic Sync Trigger
-- ==========================================

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_sync_wallet_on_transaction_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if status changed to 'completed'
  IF (TG_OP = 'INSERT' AND NEW.status = 'completed') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
    
    -- Sync the wallet balance using the existing function
    PERFORM sync_wallet_balance(NEW.user_id);
    
    -- Log the balance update for debugging
    RAISE NOTICE 'Wallet balance synced for user_id: %, transaction_id: %, amount: %', 
      NEW.user_id, NEW.id, NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS sync_wallet_on_transaction_complete ON wallet_transactions;

-- Create the trigger
CREATE TRIGGER sync_wallet_on_transaction_complete
  AFTER INSERT OR UPDATE OF status ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_sync_wallet_on_transaction_complete();

-- ==========================================
-- STEP 3: Grant Permissions
-- ==========================================

GRANT EXECUTE ON FUNCTION calculate_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_sync_wallet_on_transaction_complete() TO authenticated;

-- ==========================================
-- STEP 4: Fix Existing Wallet Balances
-- ==========================================

-- Sync all existing wallets to correct balance
DO $$
DECLARE 
  wallet_record RECORD;
  calculated_balance NUMERIC;
BEGIN
  FOR wallet_record IN SELECT user_id FROM wallets LOOP
    calculated_balance := sync_wallet_balance(wallet_record.user_id);
    RAISE NOTICE 'Synced wallet for user % - new balance: %', wallet_record.user_id, calculated_balance;
  END LOOP;
END $$;

-- ==========================================
-- STEP 5: Verification
-- ==========================================

-- Check if trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sync_wallet_on_transaction_complete'
  ) THEN
    RAISE NOTICE '✅ Trigger installed successfully!';
  ELSE
    RAISE WARNING '❌ Trigger was not created!';
  END IF;
END $$;

-- Show summary of all wallets
SELECT 
  COUNT(*) as total_wallets,
  SUM(balance) as total_balance,
  MIN(balance) as min_balance,
  MAX(balance) as max_balance,
  AVG(balance) as avg_balance
FROM wallets;

-- Show your specific wallet (replace with your email)
-- Uncomment and update email to check your balance:
/*
SELECT 
  w.user_id,
  u.email,
  w.balance as current_balance,
  calculate_wallet_balance(w.user_id) as calculated_balance,
  (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.user_id = w.user_id AND wt.status = 'completed') as completed_txns,
  (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.user_id = w.user_id AND wt.status = 'pending') as pending_txns
FROM wallets w
JOIN auth.users u ON u.id = w.user_id
WHERE u.email = 'your-email@example.com';
*/

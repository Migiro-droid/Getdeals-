-- Fix wallet balance calculation to only include completed transactions
-- This ensures only successful M-Pesa/Rukisha deposits are counted

-- Create a function to calculate wallet balance from completed transactions only
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

-- Create a function to update wallet balance based on completed transactions
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

-- Create a function that only increments balance for completed transactions
CREATE OR REPLACE FUNCTION safe_increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  -- Always recalculate from completed transactions
  new_balance := calculate_wallet_balance(p_user_id);
  
  -- Update wallet with calculated balance
  UPDATE wallets 
  SET 
    balance = new_balance,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no wallet exists, create one
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id, balance, is_active, created_at, updated_at)
    VALUES (p_user_id, new_balance, true, NOW(), NOW());
  END IF;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for wallet balances that always shows correct balance
CREATE OR REPLACE VIEW wallet_balances_view AS
SELECT 
  w.id,
  w.user_id,
  calculate_wallet_balance(w.user_id) as balance,
  w.is_active,
  w.getdeals_number,
  w.created_at,
  w.updated_at,
  -- Transaction summary
  (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.user_id = w.user_id AND wt.status = 'completed') as completed_transactions,
  (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.user_id = w.user_id AND wt.status = 'pending') as pending_transactions,
  (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.user_id = w.user_id AND wt.status = 'failed') as failed_transactions
FROM wallets w;

-- Fix existing wallet balances based on completed transactions only
DO $$
DECLARE 
  wallet_record RECORD;
  calculated_balance NUMERIC;
BEGIN
  FOR wallet_record IN SELECT user_id FROM wallets LOOP
    calculated_balance := calculate_wallet_balance(wallet_record.user_id);
    
    UPDATE wallets 
    SET balance = calculated_balance, updated_at = NOW()
    WHERE user_id = wallet_record.user_id;
    
    RAISE NOTICE 'Updated wallet for user % - new balance: %', wallet_record.user_id, calculated_balance;
  END LOOP;
END $$;
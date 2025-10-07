const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createBalanceFunctions() {
  console.log('🔧 Creating wallet balance calculation functions...')
  
  try {
    // Create supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('📝 You need to manually run this SQL in Supabase SQL Editor:')
    console.log('===========================================================')
    
    const sql = `
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

-- Create a function for safe balance updates (recalculates from transactions)
CREATE OR REPLACE FUNCTION safe_increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  -- Always recalculate from completed transactions instead of just incrementing
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
    `
    
    console.log(sql)
    console.log('===========================================================')
    console.log('')
    console.log('📋 Steps to complete the fix:')
    console.log('1. Go to https://supabase.com/dashboard/project/fxyifnckgllxqbggegtw/sql')
    console.log('2. Copy and paste the SQL above')
    console.log('3. Click "Run" to create the functions')
    console.log('4. The webhook will now use proper balance calculation')
    console.log('')
    console.log('✅ After running the SQL, your wallet balance system will be fully fixed!')
    console.log('✅ Only completed transactions will count toward wallet balances')
    console.log('✅ Failed/pending deposits will be properly excluded')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Show the SQL to create
createBalanceFunctions()
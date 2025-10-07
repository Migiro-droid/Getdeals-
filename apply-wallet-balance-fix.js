/**
 * Apply wallet balance fix migration directly to Supabase
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
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
`;

const fixExistingBalancesSQL = `
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
`;

async function applyWalletBalanceFix() {
  console.log('🔧 Applying wallet balance calculation fix...');
  console.log('===============================================');
  
  try {
    // Step 1: Create the balance calculation functions
    console.log('1. Creating balance calculation functions...');
    const { error: functionsError } = await supabase.rpc('sql', {
      query: migrationSQL
    });

    if (functionsError) {
      console.error('❌ Failed to create functions:', functionsError);
      return;
    }
    console.log('✅ Balance calculation functions created');

    // Step 2: Fix existing wallet balances
    console.log('2. Fixing existing wallet balances...');
    const { error: fixError } = await supabase.rpc('sql', {
      query: fixExistingBalancesSQL
    });

    if (fixError) {
      console.error('❌ Failed to fix existing balances:', fixError);
      return;
    }
    console.log('✅ Existing wallet balances fixed');

    // Step 3: Verify the fix by checking some balances
    console.log('3. Verifying wallet balances...');
    const { data: wallets, error: verifyError } = await supabase
      .from('wallets')
      .select('user_id, balance')
      .limit(10);

    if (verifyError) {
      console.error('❌ Failed to verify balances:', verifyError);
      return;
    }

    console.log('📊 Sample wallet balances after fix:');
    wallets?.forEach((wallet, index) => {
      console.log(`   ${index + 1}. User: ${wallet.user_id.slice(0, 8)}... - Balance: KES ${wallet.balance}`);
    });

    console.log('');
    console.log('🎉 Wallet balance calculation fix applied successfully!');
    console.log('✅ Only completed transactions are now counted toward balances');
    console.log('✅ Failed and pending transactions are ignored');
    console.log('✅ All existing balances have been recalculated');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the fix
applyWalletBalanceFix();
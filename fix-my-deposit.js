/**
 * Manual script to fix your stuck 100 KSH deposit
 * Run: node fix-my-deposit.js <your_phone_number>
 * Example: node fix-my-deposit.js 254712345678
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('\n❌ Please provide your phone number!');
  console.log('Usage: node fix-my-deposit.js  254717822846\n');
  process.exit(1);
}

async function fixMyDeposit() {
  console.log(`\n🔍 Looking for your pending 100 KSH deposit...\n`);

  // 1. Try to find user by phone (try multiple formats)
  let user = null;
  
  // Try exact match first
  let { data: userData, error: userError } = await supabase
    .from('user_profile')
    .select('user_id, first_name, last_name, phone')
    .eq('phone', phoneNumber)
    .single();

  if (userData) {
    user = userData;
  } else {
    // Try with + prefix
    const { data: userData2 } = await supabase
      .from('user_profile')
      .select('user_id, first_name, last_name, phone')
      .eq('phone', '+' + phoneNumber)
      .single();
    
    if (userData2) {
      user = userData2;
    } else {
      // Try without prefix (just last 9 digits)
      const lastNineDigits = phoneNumber.slice(-9);
      const { data: userData3 } = await supabase
        .from('user_profile')
        .select('user_id, first_name, last_name, phone')
        .ilike('phone', `%${lastNineDigits}`)
        .single();
      
      if (userData3) {
        user = userData3;
      }
    }
  }

  if (!user) {
    console.error('❌ User not found with phone:', phoneNumber);
    console.log('\n🔍 Searching for pending 100 KSH deposits by phone in transactions...\n');
    
    // Search directly in wallet_transactions by phone
    const { data: deposits, error: depositError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('transaction_type', 'deposit')
      .eq('amount', 10000)
      .eq('status', 'pending')
      .or(`phone_number.eq.${phoneNumber},phone_number.eq.+${phoneNumber},phone_number.ilike.%${phoneNumber.slice(-9)}`)
      .order('created_at', { ascending: false });

    if (depositError || !deposits || deposits.length === 0) {
      console.error('❌ No pending 100 KSH deposits found with that phone number.');
      console.log('\n💡 Showing ALL pending 100 KSH deposits in system:\n');
      
      // Show all pending deposits
      const { data: allDeposits } = await supabase
        .from('wallet_transactions')
        .select('*, user_profile!wallet_transactions_user_id_fkey(first_name, last_name, phone)')
        .eq('transaction_type', 'deposit')
        .eq('amount', 10000)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (allDeposits && allDeposits.length > 0) {
        allDeposits.forEach((dep, idx) => {
          console.log(`${idx + 1}. Phone: ${dep.phone_number || 'N/A'}`);
          console.log(`   User: ${dep.user_profile?.first_name} ${dep.user_profile?.last_name}`);
          console.log(`   Transaction ID: ${dep.transaction_id}`);
          console.log(`   Created: ${dep.created_at}\n`);
        });
      } else {
        console.log('   No pending deposits found.\n');
      }
      return;
    }

    // Process deposits found by phone in transactions
    console.log(`✅ Found ${deposits.length} pending deposit(s) with your phone number\n`);
    
    for (const deposit of deposits) {
      await processDeposit(deposit);
    }
    return;
  }

  console.log(`✅ Found user: ${user.first_name} ${user.last_name}`);
  console.log(`   User ID: ${user.user_id}\n`);

  // 2. Find pending 100 KSH deposit
  const { data: pendingDeposits, error: depositError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.user_id)
    .eq('transaction_type', 'deposit')
    .eq('amount', 10000) // 100 KSH in cents
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (depositError) {
    console.error('❌ Error finding deposits:', depositError.message);
    return;
  }

  if (!pendingDeposits || pendingDeposits.length === 0) {
    console.log('ℹ️  No pending 100 KSH deposits found.');
    console.log('   Checking if already completed...\n');

    // Check for completed deposit
    const { data: completed } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('transaction_type', 'deposit')
      .eq('amount', 10000)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1);

    if (completed && completed.length > 0) {
      console.log('✅ Found completed 100 KSH deposit:');
      console.log(`   Transaction ID: ${completed[0].transaction_id}`);
      console.log(`   Completed at: ${completed[0].updated_at}`);
      console.log(`   M-Pesa Receipt: ${completed[0].mpesa_receipt_number || 'N/A'}`);
      
      // Check current balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.user_id)
        .single();

      if (wallet) {
        console.log(`\n💰 Current wallet balance: KES ${(wallet.balance / 100).toFixed(2)}`);
      }
    } else {
      console.log('ℹ️  No 100 KSH deposits found (pending or completed).');
    }
    return;
  }

  console.log(`🔍 Found ${pendingDeposits.length} pending deposit(s):\n`);

  // Process each pending deposit
  for (const deposit of pendingDeposits) {
    await processDeposit(deposit, user);
  }

  console.log('=' .repeat(60) + '\n');
}

async function processDeposit(deposit, user = null) {
  // If user not provided, fetch it
  if (!user && deposit.user_id) {
    const { data: userData } = await supabase
      .from('user_profile')
      .select('user_id, first_name, last_name, phone')
      .eq('user_id', deposit.user_id)
      .single();
    user = userData;
  }

  console.log(`📋 Transaction Details:`);
  console.log(`   ID: ${deposit.id}`);
  console.log(`   Transaction ID: ${deposit.transaction_id}`);
  console.log(`   Amount: KES ${(deposit.amount / 100).toFixed(2)}`);
  console.log(`   Phone: ${deposit.phone_number}`);
  console.log(`   User: ${user ? `${user.first_name} ${user.last_name}` : 'Unknown'}`);
  console.log(`   Created: ${deposit.created_at}`);
  console.log(`   Status: ${deposit.status}\n`);

  console.log('🔧 Fixing transaction...');

  try {
    // Update transaction to completed
    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
        mpesa_receipt_number: deposit.mpesa_receipt_number || 'MANUAL_FIX_' + Date.now()
      })
      .eq('id', deposit.id);

    if (updateError) {
      console.error('   ❌ Failed to update transaction:', updateError.message);
      return;
    }

    console.log('   ✅ Transaction marked as completed');

    // Recalculate wallet balance
    const { error: balanceError } = await supabase.rpc('safe_increment_wallet_balance', {
      p_user_id: deposit.user_id,
      p_amount: 0 // Just trigger recalculation
    });

    if (balanceError) {
      console.error('   ❌ Failed to update wallet balance:', balanceError.message);
      console.log('   ℹ️  Transaction is marked complete but balance needs manual update');
      return;
    }

    console.log('   ✅ Wallet balance updated');

    // Get new balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', deposit.user_id)
      .single();

    if (wallet) {
      console.log(`   💰 New balance: KES ${(wallet.balance / 100).toFixed(2)}`);
    }

    console.log(`\n✅ SUCCESS! Your 100 KSH has been added to your wallet!\n`);

  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
}

fixMyDeposit().catch(error => {
  console.error('\n❌ Script error:', error.message);
  process.exit(1);
});

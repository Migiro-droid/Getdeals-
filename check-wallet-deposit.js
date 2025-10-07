/**
 * Diagnostic script to check wallet deposit status
 * Run: node check-wallet-deposit.js <phone_number>
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('❌ Please provide phone number: node check-wallet-deposit.js 254XXXXXXXXX');
  process.exit(1);
}

async function checkWalletDeposit() {
  console.log(`\n🔍 Checking wallet deposit for phone: ${phoneNumber}\n`);

  // 1. Find user by phone
  const { data: user, error: userError } = await supabase
    .from('user_profile')
    .select('user_id, first_name, last_name, phone, getdeals_number')
    .eq('phone', phoneNumber)
    .single();

  if (userError || !user) {
    console.error('❌ User not found with phone:', phoneNumber);
    console.error('Error:', userError?.message);
    return;
  }

  console.log('✅ User found:');
  console.log(`   Name: ${user.first_name} ${user.last_name}`);
  console.log(`   GetDeals Number: ${user.getdeals_number}`);
  console.log(`   User ID: ${user.user_id}\n`);

  // 2. Check wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.user_id)
    .single();

  if (walletError) {
    console.error('❌ Wallet not found:', walletError.message);
  } else {
    console.log('💰 Current Wallet Balance:');
    console.log(`   Balance: KES ${(wallet.balance / 100).toFixed(2)}`);
    console.log(`   Updated: ${wallet.updated_at}\n`);
  }

  // 3. Check recent transactions
  const { data: transactions, error: txError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.user_id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (txError) {
    console.error('❌ Error fetching transactions:', txError.message);
  } else {
    console.log(`📋 Recent Transactions (${transactions?.length || 0}):`);
    transactions?.forEach((tx, i) => {
      console.log(`\n   ${i + 1}. Transaction ID: ${tx.id}`);
      console.log(`      Type: ${tx.transaction_type}`);
      console.log(`      Amount: KES ${(tx.amount / 100).toFixed(2)}`);
      console.log(`      Status: ${tx.status}`);
      console.log(`      Phone: ${tx.phone_number}`);
      console.log(`      M-Pesa Receipt: ${tx.mpesa_receipt_number || 'N/A'}`);
      console.log(`      Created: ${tx.created_at}`);
      console.log(`      Updated: ${tx.updated_at}`);
    });
  }

  // 4. Check for pending 100 KES deposit
  const { data: pendingDeposit, error: pendingError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.user_id)
    .eq('transaction_type', 'deposit')
    .eq('amount', 10000) // 100 KES in cents
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (pendingDeposit && pendingDeposit.length > 0) {
    console.log('\n⏳ FOUND PENDING 100 KES DEPOSIT:');
    const tx = pendingDeposit[0];
    console.log(`   Transaction ID: ${tx.id}`);
    console.log(`   Status: ${tx.status}`);
    console.log(`   Created: ${tx.created_at}`);
    console.log(`   Phone: ${tx.phone_number}`);
    console.log(`   M-Pesa Code: ${tx.mpesa_code || 'Not set'}`);
    console.log(`\n   ⚠️  This transaction is stuck in ${tx.status} status!`);
    console.log(`   💡 The webhook may not have received the callback from M-Pesa.`);
  }

  // 5. Check for completed 100 KES deposit
  const { data: completedDeposit, error: completedError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.user_id)
    .eq('transaction_type', 'deposit')
    .eq('amount', 10000) // 100 KES in cents
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);

  if (completedDeposit && completedDeposit.length > 0) {
    console.log('\n✅ FOUND COMPLETED 100 KES DEPOSIT:');
    const tx = completedDeposit[0];
    console.log(`   Transaction ID: ${tx.id}`);
    console.log(`   M-Pesa Receipt: ${tx.mpesa_receipt_number || 'N/A'}`);
    console.log(`   Completed: ${tx.updated_at}`);
    console.log(`\n   ✅ Transaction was marked as completed.`);
    console.log(`   💡 If balance is not showing, there may be a calculation issue.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

checkWalletDeposit().catch(console.error);

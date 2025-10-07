/**
 * Fix specific transactions by ID
 * Run: node fix-by-id.js <transaction_id1> <transaction_id2> ...
 * Or: node fix-by-id.js ALL_PENDING
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const transactionIds = process.argv.slice(2);

if (transactionIds.length === 0) {
  console.error('\n❌ Please provide transaction ID(s) to fix!');
  console.log('Usage: node fix-by-id.js <transaction_id>');
  console.log('   Or: node fix-by-id.js ALL_PENDING (to fix all pending deposits)\n');
  process.exit(1);
}

async function fixTransaction(transactionId) {
  console.log(`\n🔧 Fixing transaction: ${transactionId}\n`);

  // Get transaction details - try by transaction_id first, then by id
  let transaction, fetchError;
  
  const { data: byTransactionId, error: err1 } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('transaction_id', transactionId)
    .maybeSingle();

  if (byTransactionId) {
    transaction = byTransactionId;
  } else {
    // Try by id field
    const { data: byId, error: err2 } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();
    
    if (byId) {
      transaction = byId;
    } else {
      fetchError = err1 || err2;
    }
  }

  if (fetchError || !transaction) {
    console.error(`   ❌ Transaction not found: ${transactionId}`);
    return false;
  }

  console.log(`   Amount: KES ${transaction.amount} (raw: ${transaction.amount})`);
  console.log(`   Status: ${transaction.status}`);
  console.log(`   Phone: ${transaction.phone_number}`);
  console.log(`   User ID: ${transaction.user_id}`);

  if (transaction.status === 'completed') {
    console.log(`   ✅ Already completed - skipping\n`);
    return true;
  }

  if (transaction.status === 'failed') {
    console.log(`   ⚠️  Status is "failed" - are you sure you want to complete it?`);
    console.log(`   ℹ️  Skipping failed transaction\n`);
    return false;
  }

  // Update to completed
  const { error: updateError } = await supabase
    .from('wallet_transactions')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    })
    .eq('id', transaction.id);

  if (updateError) {
    console.error(`   ❌ Failed to update: ${updateError.message}\n`);
    return false;
  }

  console.log(`   ✅ Status updated to completed`);

  // Update wallet balance
  const { error: balanceError } = await supabase.rpc('safe_increment_wallet_balance', {
    p_user_id: transaction.user_id,
    p_amount: 0 // Trigger recalculation
  });

  if (balanceError) {
    console.error(`   ❌ Failed to update balance: ${balanceError.message}`);
    console.log(`   ℹ️  Transaction is marked complete but balance not updated\n`);
    return false;
  }

  console.log(`   ✅ Wallet balance updated`);

  // Get new balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', transaction.user_id)
    .single();

  if (wallet) {
    console.log(`   💰 New balance: KES ${wallet.balance} (raw: ${wallet.balance})`);
  }

  console.log(`   ✅ SUCCESS!\n`);
  return true;
}

async function fixAllPending() {
  console.log('\n🔧 Fixing ALL pending deposits...\n');

  const { data: pending, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('type', 'deposit')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error || !pending || pending.length === 0) {
    console.log('✅ No pending deposits found!\n');
    return;
  }

  console.log(`Found ${pending.length} pending deposit(s):\n`);

  let fixed = 0;
  for (const tx of pending) {
    const success = await fixTransaction(tx.transaction_id);
    if (success) fixed++;
  }

  console.log('='.repeat(60));
  console.log(`\n✅ Fixed ${fixed} out of ${pending.length} transactions!\n`);
}

async function main() {
  if (transactionIds[0] === 'ALL_PENDING') {
    await fixAllPending();
  } else {
    let fixed = 0;
    for (const id of transactionIds) {
      const success = await fixTransaction(id);
      if (success) fixed++;
    }
    console.log('='.repeat(60));
    console.log(`\n✅ Fixed ${fixed} out of ${transactionIds.length} transaction(s)!\n`);
  }
}

main().catch(error => {
  console.error('\n❌ Script error:', error.message);
  process.exit(1);
});

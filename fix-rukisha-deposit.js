/**
 * Fix the stuck 100 KSH deposit from Rukisha
 * Reference: 7ed15e16-c007-4e36-a64b-54612783d336
 * Phone: 254719575272
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function fixStuckDeposit() {
  console.log('\n🔧 Fixing stuck Rukisha deposit...\n');

  const reference = '7ed15e16-c007-4e36-a64b-54612783d336';
  const phone = '254719575272';
  const mpesaReceipt = 'TJA866WV6R';

  // Find the transaction by reference
  const { data: transaction, error: findError } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('reference', reference)
    .single();

  if (findError || !transaction) {
    console.error('❌ Transaction not found with reference:', reference);
    console.log('\n🔍 Searching by phone number instead...\n');
    
    // Try finding by phone and amount
    const { data: transactions } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('phone_number', phone)
      .eq('amount', 100)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!transactions || transactions.length === 0) {
      console.error('❌ No pending 100 KSH transactions found for phone:', phone);
      return;
    }

    console.log('✅ Found transaction:', transactions[0].id);
    await completeTransaction(transactions[0]);
    return;
  }

  console.log('✅ Found transaction:', transaction.id);
  await completeTransaction(transaction);
}

async function completeTransaction(transaction) {
  console.log('\n📋 Transaction Details:');
  console.log(`   ID: ${transaction.id}`);
  console.log(`   Reference: ${transaction.reference}`);
  console.log(`   Amount: KES ${transaction.amount}`);
  console.log(`   Phone: ${transaction.phone_number}`);
  console.log(`   Status: ${transaction.status}`);
  console.log(`   User ID: ${transaction.user_id}`);

  if (transaction.status === 'completed') {
    console.log('\n✅ Transaction already completed!');
    
    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', transaction.user_id)
      .single();

    if (wallet) {
      console.log(`💰 Current wallet balance: KES ${wallet.balance}\n`);
    }
    return;
  }

  console.log('\n🔧 Updating transaction to completed...');

  // Update transaction status
  const { error: updateError } = await supabase
    .from('wallet_transactions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id);

  if (updateError) {
    console.error('❌ Failed to update transaction:', updateError.message);
    return;
  }

  console.log('✅ Transaction marked as completed');

  // Recalculate wallet balance
  console.log('🔧 Updating wallet balance...');

  const { data: allTransactions } = await supabase
    .from('wallet_transactions')
    .select('amount, type, status')
    .eq('user_id', transaction.user_id);

  let balance = 0;
  allTransactions?.forEach((tx) => {
    if (tx.status === 'completed') {
      if (tx.type === 'deposit') {
        balance += tx.amount;
      } else if (tx.type === 'deduction' || tx.type === 'withdrawal') {
        balance -= tx.amount;
      }
    }
  });

  console.log(`💰 Calculated balance: KES ${balance}`);

  // Update wallet
  const { error: walletError } = await supabase
    .from('wallets')
    .update({ balance })
    .eq('user_id', transaction.user_id);

  if (walletError) {
    console.error('❌ Failed to update wallet:', walletError.message);
    return;
  }

  console.log('✅ Wallet balance updated successfully!');
  console.log(`\n🎉 SUCCESS! Your wallet now has KES ${balance}\n`);
}

fixStuckDeposit().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

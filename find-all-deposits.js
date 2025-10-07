/**
 * Find ALL wallet transactions to locate your deposit
 * Run: node find-all-deposits.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function findAllDeposits() {
  console.log('\n🔍 Searching ALL wallet transactions...\n');

  // Get ALL transactions, not just pending
  const { data: transactions, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('type', 'deposit')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log('❌ No deposits found in wallet_transactions table\n');
    return;
  }

  console.log(`✅ Found ${transactions.length} deposit transaction(s):\n`);
  console.log('='.repeat(80) + '\n');

  transactions.forEach((tx, idx) => {
    console.log(`${idx + 1}. Transaction ID: ${tx.transaction_id || tx.id}`);
    console.log(`   Amount: KES ${(tx.amount / 100).toFixed(2)}`);
    console.log(`   Status: ${tx.status}`);
    console.log(`   Phone: ${tx.phone_number || 'N/A'}`);
    console.log(`   User ID: ${tx.user_id}`);
    console.log(`   M-Pesa Receipt: ${tx.mpesa_receipt_number || 'N/A'}`);
    console.log(`   Created: ${tx.created_at}`);
    console.log(`   Updated: ${tx.updated_at}`);
    
    if (tx.status === 'pending') {
      console.log(`   ⚠️  STATUS: PENDING - NEEDS FIX!`);
    }
    
    console.log('\n' + '-'.repeat(80) + '\n');
  });

  // Show summary by status
  const statusCounts = transactions.reduce((acc, tx) => {
    acc[tx.status] = (acc[tx.status] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Summary by Status:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });

  // Show pending transactions that need fixing
  const pending = transactions.filter(tx => tx.status === 'pending');
  if (pending.length > 0) {
    console.log(`\n⚠️  ${pending.length} PENDING transaction(s) need to be fixed!`);
    console.log('\nTo fix a specific transaction, note its ID and we\'ll create a fix script.\n');
  } else {
    console.log('\n✅ No pending transactions - all deposits are completed!\n');
  }
}

findAllDeposits().catch(error => {
  console.error('\n❌ Script error:', error.message);
  process.exit(1);
});

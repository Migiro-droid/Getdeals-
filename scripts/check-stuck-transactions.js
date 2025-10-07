/**
 * Script to check and fix stuck wallet transactions
 * Identifies pending deposits that may have succeeded but weren't updated due to missing callback
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxyifnckgllxqbggegtw.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

// Note: This would need the service role key to run properly
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStuckTransactions() {
  console.log('🔍 Checking for stuck wallet transactions...');
  console.log('=============================================');
  
  try {
    // Find pending transactions older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: stuckTransactions, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying transactions:', error);
      return;
    }

    if (!stuckTransactions || stuckTransactions.length === 0) {
      console.log('✅ No stuck transactions found!');
      return;
    }

    console.log(`⚠️  Found ${stuckTransactions.length} potentially stuck transactions:`);
    console.log('');

    stuckTransactions.forEach((transaction, index) => {
      console.log(`${index + 1}. Transaction ID: ${transaction.transaction_id}`);
      console.log(`   Amount: KES ${transaction.amount}`);
      console.log(`   Phone: ${transaction.phone}`);
      console.log(`   Created: ${new Date(transaction.created_at).toLocaleString()}`);
      console.log(`   Age: ${Math.round((Date.now() - new Date(transaction.created_at).getTime()) / (1000 * 60))} minutes`);
      console.log('');
    });

    console.log('🔧 Recommended Actions:');
    console.log('=======================');
    console.log('1. Check M-Pesa statements to verify if payments were actually processed');
    console.log('2. For confirmed payments, manually update transaction status to "completed"');
    console.log('3. Update wallet balances for confirmed successful deposits');
    console.log('4. For failed payments, update status to "failed"');
    console.log('');
    console.log('📝 Manual Fix Query (for confirmed successful payments):');
    console.log('```sql');
    console.log('-- Update transaction status');
    console.log('UPDATE wallet_transactions ');
    console.log('SET status = \'completed\', updated_at = NOW()');
    console.log('WHERE transaction_id = \'TRANSACTION_ID_HERE\';');
    console.log('');
    console.log('-- Update wallet balance');
    console.log('SELECT increment_wallet_balance(\'USER_ID_HERE\', AMOUNT_HERE);');
    console.log('```');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Export for potential use in other scripts
export { checkStuckTransactions };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkStuckTransactions();
}
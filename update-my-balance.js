import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

const userId = '52e70c66-8dd3-4574-8509-53c07610f280';

console.log('\n🔧 Updating wallet balance...\n');

// Calculate total from completed transactions
const { data: transactions } = await s
  .from('wallet_transactions')
  .select('amount, type, status')
  .eq('user_id', userId);

let balance = 0;
transactions.forEach(tx => {
  if (tx.status === 'completed') {
    if (tx.type === 'deposit') {
      balance += tx.amount;
    } else if (tx.type === 'deduction' || tx.type === 'withdrawal') {
      balance -= tx.amount;
    }
  }
});

console.log(`Calculated balance: KES ${balance}`);

// Update wallet
const { data: wallet, error } = await s
  .from('wallets')
  .update({ balance: balance })
  .eq('user_id', userId)
  .select();

if (error) {
  console.error('❌ Error:', error.message);
} else {
  console.log(`✅ Wallet updated successfully!`);
  console.log(`💰 New balance: KES ${wallet[0].balance}\n`);
}

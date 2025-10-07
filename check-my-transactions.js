import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

console.log('\n🔍 Searching for YOUR transactions (254717822846):\n');

const { data } = await s
  .from('wallet_transactions')
  .select('*')
  .eq('phone_number', '254717822846')
  .order('created_at', { ascending: false });

console.log('Raw data from database:');
data.forEach((tx, idx) => {
  console.log(`\n${idx + 1}. Transaction ID: ${tx.transaction_id}`);
  console.log(`   Raw amount value: ${tx.amount} (this is the actual number in DB)`);
  console.log(`   If stored in cents: KES ${(tx.amount / 100).toFixed(2)}`);
  console.log(`   If stored in KSH: KES ${tx.amount}`);
  console.log(`   Status: ${tx.status}`);
  console.log(`   Type: ${tx.type}`);
  console.log(`   Created: ${tx.created_at}`);
});

console.log('\n');
